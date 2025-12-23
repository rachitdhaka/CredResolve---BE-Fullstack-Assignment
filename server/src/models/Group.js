import { v4 as uuidv4 } from 'uuid';

export class Group {
  constructor(name, description, createdBy) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
    this.members = [createdBy]; // Creator is automatically a member
    this.createdBy = createdBy;
    this.createdAt = new Date();
  }

  addMember(userId) {
    if (!this.members.includes(userId)) {
      this.members.push(userId);
      return true;
    }
    return false;
  }

  isMember(userId) {
    return this.members.includes(userId);
  }

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
}
