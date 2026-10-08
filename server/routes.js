import { Router } from 'express';
import multer from 'multer';
import { extname, join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { db, UPLOAD_DIR, saveSetting, setting, SETTING_KEYS } from './db.js';
import { getOne, insert, listQuery, pick, remove, update } from './crud.js';
import { expand, resources } from './resources.js';
import { hash, requireAdmin, requireAuth, signIn } from './auth.js';
import { mailRouter, notifyLead } from './mail.js';

const MAX_UPLOAD = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: MAX_UPLOAD },
});

export const router = Router();

/* ------------------------------------------------------------------ *
 * Público — o que a landing page consome
 * ------------------------------------------------------------------ */

const published = (table, order = 'position') =>
  db.prepare(`SELECT * FROM ${table} WHERE published = 1 ORDER BY ${order} ASC, id ASC`).all();

router.get('/content', (_req, res) => {
  const parse = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  res.json({
    plans: published('plans').map((p) => ({
      name: p.name,
      desc: p.descr,
      price: p.price,
      unit: p.unit,
      cta: p.cta,
      features: parse(p.features, []),
      featured: !!p.featured,
    })),
    faq: published('faq').map((f) => ({ q: f.q, a: f.a })),
    portfolio: published('portfolio').map((p) => ({
      tag: p.tag,
      title: p.title,
      desc: p.descr,
      image: p.image,
      modules: parse(p.modules, []),
    })),
    testimonials: published('testimonials').map((t) => ({
      quote: t.quote,
      role: t.role,
      company: t.company,
    })),
    storyChapters: published('story_chapters').map((c) => ({
      n: c.n,
      eyebrow: c.eyebrow,
      title: c.title,
      titleAccent: c.title_accent,
      text: c.text,
      chips: parse(c.chips, []),
      ctas: parse(c.ctas, []),
    })),
    contact: setting('contact'),
    quote: setting('quote'),
    nav: setting('nav'),
    logoMeaning: setting('logoMeaning'),
    contactTopics: setting('contactTopics'),
    storyHeader: setting('storyHeader'),
    storyIntro: setting('storyIntro'),
    stage: setting('stage'),
  });
});

router.post('/leads', upload.single('file'), (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.phone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
  }

  let mediaId = null;
  if (req.file) {
    mediaId = insert('media', {
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime: req.file.mimetype,
      size: req.file.size,
    }).id;
  }

  const topics = Array.isArray(body.topics) ? body.topics : parseList(body.topics);
  const lead = insert('leads', {
    name: String(body.name),
    company: String(body.company || ''),
    email: String(body.email || ''),
    phone: String(body.phone),
    topics: JSON.stringify(topics),
    plan: String(body.plan || ''),
    message: String(body.message || ''),
    deadline: String(body.deadline || ''),
    budget: String(body.budget || ''),
    media_id: mediaId,
  });

  notifyLead(lead);
  res.status(201).json({ id: lead.id });
});

function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
}

/* ------------------------------------------------------------------ *
 * Sessão
 * ------------------------------------------------------------------ */

router.post('/auth/login', (req, res) => {
  const result = signIn(req.body?.email, req.body?.password);
  if (!result) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  res.json(result);
});

router.get('/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.post('/auth/password', requireAuth, (req, res) => {
  const { current, next } = req.body || {};
  if (!next || String(next).length < 6) {
    return res.status(400).json({ error: 'A nova senha precisa de ao menos 6 caracteres.' });
  }
  const check = signIn(req.user.email, current);
  if (!check) return res.status(400).json({ error: 'Senha atual incorreta.' });

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash(next), req.user.id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ *
 * Painel — métricas
 * ------------------------------------------------------------------ */

router.get('/admin/stats', requireAuth, (_req, res) => {
  const one = (sql) => db.prepare(sql).get().c;
  res.json({
    leads: one('SELECT COUNT(*) AS c FROM leads'),
    leadsNew: one("SELECT COUNT(*) AS c FROM leads WHERE status = 'novo'"),
    leadsWeek: one(
      "SELECT COUNT(*) AS c FROM leads WHERE created_at >= datetime('now', '-7 days')",
    ),
    plans: one('SELECT COUNT(*) AS c FROM plans WHERE published = 1'),
    faq: one('SELECT COUNT(*) AS c FROM faq WHERE published = 1'),
    portfolio: one('SELECT COUNT(*) AS c FROM portfolio WHERE published = 1'),
    testimonials: one('SELECT COUNT(*) AS c FROM testimonials WHERE published = 1'),
    media: one('SELECT COUNT(*) AS c FROM media'),
    byStatus: db
      .prepare('SELECT status, COUNT(*) AS total FROM leads GROUP BY status ORDER BY total DESC')
      .all(),
    latest: db
      .prepare('SELECT id, name, company, status, created_at FROM leads ORDER BY id DESC LIMIT 5')
      .all(),
  });
});

/* ------------------------------------------------------------------ *
 * Painel — CRUD genérico
 * ------------------------------------------------------------------ */

router.use('/admin', requireAuth);
router.use('/admin/mail', mailRouter);

/* ------------------------------------------------------------------ *
 * Painel — uploads e blocos de texto
 * ------------------------------------------------------------------ */

router.post('/admin/media/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  const row = insert('media', {
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime: req.file.mimetype,
    size: req.file.size,
  });
  res.status(201).json(row);
});

/** Sino do painel: últimas solicitações e quantas chegaram depois de `after` (último id visto). */
router.get('/admin/notifications', (req, res) => {
  const after = Number(req.query.after) || 0;
  res.json({
    unread: db.prepare('SELECT COUNT(*) AS c FROM leads WHERE id > ?').get(after).c,
    pending: db.prepare("SELECT COUNT(*) AS c FROM leads WHERE status = 'novo'").get().c,
    lastId: db.prepare('SELECT COALESCE(MAX(id), 0) AS id FROM leads').get().id,
    latest: db
      .prepare(
        'SELECT id, name, company, plan, status, created_at FROM leads ORDER BY id DESC LIMIT 8',
      )
      .all(),
  });
});

router.get('/admin/settings/:key', (req, res) => {
  if (!SETTING_KEYS.includes(req.params.key)) {
    return res.status(404).json({ error: 'Bloco não encontrado.' });
  }
  res.json({ key: req.params.key, value: setting(req.params.key) });
});

router.put('/admin/settings/:key', requireAdmin, (req, res) => {
  if (!SETTING_KEYS.includes(req.params.key)) {
    return res.status(404).json({ error: 'Bloco não encontrado.' });
  }
  saveSetting(req.params.key, req.body?.value);
  res.json({ key: req.params.key, value: setting(req.params.key) });
});

router.get('/admin/:resource', (req, res) => {
  const resource = resources[req.params.resource];
  if (!resource) return res.status(404).json({ error: 'Recurso não encontrado.' });
  if (req.params.resource === 'users' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores veem os usuários.' });
  }

  const result = listQuery(resource.table, req.query, resource);
  res.json({ ...result, rows: result.rows.map((row) => expand(resource, row)) });
});

router.get('/admin/:resource/:id', (req, res) => {
  const resource = resources[req.params.resource];
  if (!resource) return res.status(404).json({ error: 'Recurso não encontrado.' });
  if (req.params.resource === 'users' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores veem os usuários.' });
  }

  const row = getOne(resource.table, req.params.id);
  if (!row) return res.status(404).json({ error: 'Registro não encontrado.' });
  res.json(expand(resource, row));
});

router.post('/admin/:resource', (req, res) => {
  const name = req.params.resource;
  const resource = resources[name];
  if (!resource) return res.status(404).json({ error: 'Recurso não encontrado.' });
  if (name === 'leads' || name === 'media') {
    return res.status(405).json({ error: 'Este recurso não aceita criação pelo painel.' });
  }
  if (name === 'users') return createUser(req, res);

  const row = insert(resource.table, pick(req.body || {}, resource.fields));
  res.status(201).json(expand(resource, row));
});

router.put('/admin/:resource/:id', (req, res) => {
  const name = req.params.resource;
  const resource = resources[name];
  if (!resource) return res.status(404).json({ error: 'Recurso não encontrado.' });

  const data = pick(req.body || {}, resource.fields);

  const row = update(resource.table, req.params.id, data);
  if (!row) return res.status(404).json({ error: 'Registro não encontrado.' });

  if (name !== 'leads' && name !== 'users' && name !== 'media') {
    db.prepare(`UPDATE ${resource.table} SET updated_at = datetime('now') WHERE id = ?`).run(
      Number(req.params.id),
    );
  }

  if (name === 'users' && req.body?.password) {
    if (req.user.role !== 'admin' && req.user.id !== Number(req.params.id)) {
      return res.status(403).json({ error: 'Sem permissão para trocar esta senha.' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      hash(req.body.password),
      Number(req.params.id),
    );
  }

  res.json(expand(resource, getOne(resource.table, req.params.id)));
});

router.delete('/admin/:resource/:id', (req, res) => {
  const name = req.params.resource;
  const resource = resources[name];
  if (!resource) return res.status(404).json({ error: 'Recurso não encontrado.' });

  if (name === 'users') {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem remover usuários.' });
    }
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode remover o próprio usuário.' });
    }
  }

  if (name === 'media') {
    const row = getOne('media', req.params.id);
    if (row) {
      try {
        unlinkSync(join(UPLOAD_DIR, row.filename));
      } catch {
        /* arquivo já removido do disco */
      }
    }
  }

  if (!remove(resource.table, req.params.id)) {
    return res.status(404).json({ error: 'Registro não encontrado.' });
  }
  res.json({ ok: true });
});

function createUser(req, res) {
  const { name, email, password, role } = req.body || {};
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem criar usuários.' });
  }
  if (!name || !email || !password || String(password).length < 6) {
    return res
      .status(400)
      .json({ error: 'Nome, e-mail e senha (6+ caracteres) são obrigatórios.' });
  }
  const exists = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });

  const row = insert('users', {
    name: String(name),
    email: String(email).toLowerCase(),
    password_hash: hash(password),
    role: role === 'admin' ? 'admin' : 'editor',
  });
  res.status(201).json(expand(resources.users, row));
}
