import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

const mapRowToUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        email: this.email,
        createdAt: this.createdAt
      };
    }
  };
};

/**
 * Service for managing users with SQLite persistence
 */
export class UserService {
  constructor(db) {
    this.db = db;
    this.insertStmt = db.prepare(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)'
    );
    this.getByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    this.getByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    this.getAllStmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
  }

  /**
   * Create a new user with hashed password
   */
  createUser(name, email, password) {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error('Email already exists');
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

    this.insertStmt.run(id, name, email, passwordHash);
    const created = this.getUser(id);
    return created;
  }

  getUser(userId) {
    return mapRowToUser(this.getByIdStmt.get(userId));
  }

  getUserByEmail(email) {
    return mapRowToUser(this.getByEmailStmt.get(email));
  }

  getAllUsers() {
    return this.getAllStmt.all().map(mapRowToUser);
  }

  userExists(userId) {
    return Boolean(this.getByIdStmt.get(userId));
  }

  validateUsers(userIds) {
    const missingUsers = userIds.filter((userId) => !this.userExists(userId));
    return {
      valid: missingUsers.length === 0,
      missingUsers
    };
  }

  verifyPassword(email, password) {
    const row = this.getByEmailStmt.get(email);
    if (!row) return null;
    const matches = bcrypt.compareSync(password, row.password_hash);
    return matches ? mapRowToUser(row) : null;
  }
}
