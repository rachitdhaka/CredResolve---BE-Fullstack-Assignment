/**
 * SQL.js wrapper to provide a better-sqlite3-like API
 * Simplifies statement preparation and execution
 */
export const createDbWrapper = (db, saveDbCallback) => {
  return {
    prepare: (sql) => {
      return {
        run: (...params) => {
          try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            stmt.step();
            stmt.free();
            saveDbCallback();
            return { changes: db.getRowsModified() };
          } catch (err) {
            console.error('DB run error:', err.message, 'SQL:', sql, 'Params:', params);
            throw err;
          }
        },
        get: (...params) => {
          try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            const hasRow = stmt.step();
            const row = hasRow ? stmt.getAsObject() : null;
            stmt.free();
            return row;
          } catch (err) {
            console.error('DB get error:', err.message, 'SQL:', sql, 'Params:', params);
            throw err;
          }
        },
        all: (...params) => {
          try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) {
              rows.push(stmt.getAsObject());
            }
            stmt.free();
            return rows;
          } catch (err) {
            console.error('DB all error:', err.message, 'SQL:', sql, 'Params:', params);
            throw err;
          }
        }
      };
    },
    run: (sql, params = []) => {
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        saveDbCallback();
        return { changes: db.getRowsModified() };
      } catch (err) {
        console.error('DB run error:', err.message, 'SQL:', sql, 'Params:', params);
        throw err;
      }
    },
    exec: (sql) => {
      try {
        const stmt = db.prepare(sql);
        stmt.step();
        stmt.free();
        saveDbCallback();
      } catch (err) {
        console.error('DB exec error:', err.message, 'SQL:', sql);
        throw err;
      }
    },
    transaction: (fn) => {
      return () => {
        try {
          const beginStmt = db.prepare('BEGIN TRANSACTION');
          beginStmt.step();
          beginStmt.free();
          
          const result = fn();
          
          const commitStmt = db.prepare('COMMIT');
          commitStmt.step();
          commitStmt.free();
          
          saveDbCallback();
          return result;
        } catch (err) {
          try {
            const rollbackStmt = db.prepare('ROLLBACK');
            rollbackStmt.step();
            rollbackStmt.free();
          } catch (e) {
            // rollback failed, ignore
          }
          console.error('DB transaction error:', err.message);
          throw err;
        }
      };
    }
  };
};
