import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { content } from './seed-content.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = join(here, 'data');
export const UPLOAD_DIR = join(DATA_DIR, 'uploads');

mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, 'lenom.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    descr TEXT NOT NULL DEFAULT '',
    price TEXT NOT NULL DEFAULT '',
    unit TEXT NOT NULL DEFAULT '',
    cta TEXT NOT NULL DEFAULT '',
    features TEXT NOT NULL DEFAULT '[]',
    featured INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    q TEXT NOT NULL,
    a TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    descr TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    modules TEXT NOT NULL DEFAULT '[]',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS story_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    n TEXT NOT NULL DEFAULT '',
    eyebrow TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    title_accent TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    chips TEXT NOT NULL DEFAULT '[]',
    ctas TEXT NOT NULL DEFAULT '[]',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    topics TEXT NOT NULL DEFAULT '[]',
    plan TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    deadline TEXT NOT NULL DEFAULT '',
    budget TEXT NOT NULL DEFAULT '',
    media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'novo',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime TEXT NOT NULL DEFAULT '',
    size INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/** Migrações leves: adiciona colunas que surgiram depois do primeiro release. */
function addColumn(table, column, definition) {
  const exists = db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((c) => c.name === column);
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

addColumn('portfolio', 'image', "TEXT NOT NULL DEFAULT ''");
addColumn('portfolio', 'modules', "TEXT NOT NULL DEFAULT '[]'");

const count = (table) => db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;

function seedOnce(table, rows, sql) {
  if (count(table) > 0) return;
  const stmt = db.prepare(sql);
  rows.forEach((row, i) => stmt.run(...row(i)));
}

seedOnce(
  'plans',
  content.plans.map((p) => (i) => [
    p.name,
    p.desc,
    p.price,
    p.unit,
    p.cta,
    JSON.stringify(p.features),
    p.featured ? 1 : 0,
    i,
  ]),
  `INSERT INTO plans (name, descr, price, unit, cta, features, featured, position)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

seedOnce(
  'faq',
  content.faq.map((f) => (i) => [f.q, f.a, i]),
  'INSERT INTO faq (q, a, position) VALUES (?, ?, ?)',
);

seedOnce(
  'portfolio',
  content.portfolio.map((p) => (i) => [p.tag, p.title, p.desc, JSON.stringify(p.modules ?? []), i]),
  'INSERT INTO portfolio (tag, title, descr, modules, position) VALUES (?, ?, ?, ?, ?)',
);

seedOnce(
  'testimonials',
  content.testimonials.map((t) => (i) => [t.quote, t.role, t.company, i]),
  'INSERT INTO testimonials (quote, role, company, position) VALUES (?, ?, ?, ?)',
);

seedOnce(
  'story_chapters',
  content.storyChapters.map((c) => (i) => [
    c.n,
    c.eyebrow,
    c.title,
    c.titleAccent,
    c.text,
    JSON.stringify(c.chips ?? []),
    JSON.stringify(c.ctas ?? []),
    i,
  ]),
  `INSERT INTO story_chapters (n, eyebrow, title, title_accent, text, chips, ctas, position)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

/** Blocos que não são listas viram chaves únicas em `settings`. */
export const SETTING_KEYS = [
  'contact',
  'quote',
  'nav',
  'logoMeaning',
  'contactTopics',
  'storyHeader',
  'storyIntro',
  'stage',
];

const upsertSetting = db.prepare(
  `INSERT INTO settings (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO NOTHING`,
);
for (const key of SETTING_KEYS) {
  upsertSetting.run(key, JSON.stringify(content[key]));
}

if (count('users') === 0) {
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
    'Administrador',
    'admin@lenom.ai',
    bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'lenom@2026', 10),
    'admin',
  );
  console.log('[db] usuário admin criado: admin@lenom.ai');
}

export function setting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

export function saveSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, JSON.stringify(value));
}
