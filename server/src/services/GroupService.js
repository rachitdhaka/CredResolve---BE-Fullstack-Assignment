import { v4 as uuidv4 } from 'uuid';

const mapRowToGroup = (row, members = []) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    members,
    createdBy: row.created_by,
    createdAt: row.created_at,
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        members: this.members,
        createdBy: this.createdBy,
        createdAt: this.createdAt
      };
    }
  };
};

/**
 * Service for managing groups with SQLite persistence
 */
export class GroupService {
  constructor(db, userService) {
    this.db = db;
    this.userService = userService;

    this.insertGroupStmt = db.prepare(
      'INSERT INTO groups (id, name, description, created_by) VALUES (?, ?, ?, ?)'
    );
    this.insertMemberStmt = db.prepare(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
    );
    this.getGroupStmt = db.prepare('SELECT * FROM groups WHERE id = ?');
    this.getMembersStmt = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?');
    this.getAllGroupsStmt = db.prepare('SELECT * FROM groups ORDER BY created_at DESC');
    this.getUserGroupsStmt = db.prepare(
      'SELECT g.* FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = ? ORDER BY g.created_at DESC'
    );
    this.memberExistsStmt = db.prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
    );
  }

  createGroup(name, description, createdBy) {
    if (!this.userService.userExists(createdBy)) {
      throw new Error('Creator user does not exist');
    }

    const groupId = uuidv4();


    // Create group and add creator as member
    this.insertGroupStmt.run(groupId, name, description, createdBy);
    this.insertMemberStmt.run(groupId, createdBy);
    
    return this.getGroup(groupId);
  }

  getGroup(groupId) {
    const row = this.getGroupStmt.get(groupId);
    if (!row) return null;
    const members = this.getMembersStmt.all(groupId).map((m) => m.user_id);
    return mapRowToGroup(row, members);
  }

  getAllGroups() {
    const rows = this.getAllGroupsStmt.all();
    return rows.map((row) => {
      const members = this.getMembersStmt.all(row.id).map((m) => m.user_id);
      return mapRowToGroup(row, members);
    });
  }

  getUserGroups(userId) {
    const rows = this.getUserGroupsStmt.all(userId);
    return rows.map((row) => {
      const members = this.getMembersStmt.all(row.id).map((m) => m.user_id);
      return mapRowToGroup(row, members);
    });
  }

  addMember(groupId, userId) {
    const group = this.getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (!this.userService.userExists(userId)) {
      throw new Error('User does not exist');
    }

    const existing = this.memberExistsStmt.get(groupId, userId);
    if (existing) {
      return false;
    }

    this.insertMemberStmt.run(groupId, userId);
    return true;
  }

  groupExists(groupId) {
    return Boolean(this.getGroupStmt.get(groupId));
  }

  validateGroupMembers(groupId, userIds) {
    const group = this.getGroup(groupId);
    if (!group) {
      return { valid: false, nonMembers: userIds };
    }

    const nonMembers = userIds.filter((userId) => !this.memberExistsStmt.get(groupId, userId));
    return {
      valid: nonMembers.length === 0,
      nonMembers
    };
  }
}
