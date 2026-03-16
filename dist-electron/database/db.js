"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initDatabase = initDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
let db = null;
function getDb() {
    if (!db)
        throw new Error('Database not initialized — call initDatabase() first');
    return db;
}
async function initDatabase() {
    const userDataPath = electron_1.app.getPath('userData');
    const dbPath = path_1.default.join(userDataPath, 'citeforge.db');
    db = new better_sqlite3_1.default(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    // Run schema
    const schemaPath = path_1.default.join(__dirname, '../database/schema.sql');
    const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log(`[DB] Initialized at ${dbPath}`);
}
function closeDatabase() {
    db?.close();
    db = null;
}
