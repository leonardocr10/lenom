import { Router } from 'express';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { db, saveSetting, setting } from './db.js';
import { requireAdmin } from './auth.js';

/* ------------------------------------------------------------------ *
 * Esquema
 * ------------------------------------------------------------------ */

db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder TEXT NOT NULL DEFAULT 'inbox',
    remote_folder TEXT,
    uid INTEGER,
    message_id TEXT NOT NULL DEFAULT '',
    from_name TEXT NOT NULL DEFAULT '',
    from_email TEXT NOT NULL DEFAULT '',
    to_email TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    snippet TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    html TEXT NOT NULL DEFAULT '',
    attachments TEXT NOT NULL DEFAULT '[]',
    category TEXT NOT NULL DEFAULT 'contato',
    seen INTEGER NOT NULL DEFAULT 0,
    answered INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (remote_folder, uid)
  );
  CREATE INDEX IF NOT EXISTS emails_folder_date ON emails (folder, date DESC);

  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mail_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    template TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'enviado',
    error TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const TEMPLATES = [
  {
    slug: 'lead-confirmacao',
    name: 'Confirmação de solicitação',
    description: 'Enviado ao cliente logo após ele preencher o formulário de orçamento.',
    subject: 'Recebemos sua solicitação, {{nome}}!',
    body: `Olá, {{nome}}!

Recebemos sua solicitação de orçamento e já estamos analisando.
Em até 1 dia útil entraremos em contato para entender os detalhes do seu projeto.

Resumo do que você enviou:
Plano de interesse: {{plano}}
Mensagem: {{mensagem}}

Se preferir, fale com a gente agora pelo WhatsApp.

Abraços,
Equipe Lenom.AI`,
  },
  {
    slug: 'lead-aviso',
    name: 'Aviso interno de nova solicitação',
    description: 'Enviado para a equipe (e-mail de notificação) quando chega uma solicitação.',
    subject: 'Nova solicitação: {{nome}} {{empresa}}',
    body: `Chegou uma nova solicitação pelo site.

Nome: {{nome}}
Empresa: {{empresa}}
E-mail: {{email}}
Telefone: {{telefone}}
Plano: {{plano}}
Prazo: {{prazo}}
Investimento: {{investimento}}

Mensagem:
{{mensagem}}

Abra o painel para responder.`,
  },
  {
    slug: 'resposta-padrao',
    name: 'Resposta padrão',
    description: 'Modelo base para mensagens enviadas pelo painel ("Enviar mensagem").',
    subject: 'Lenom.AI — {{assunto}}',
    body: `Olá, {{nome}}!

{{mensagem}}

Abraços,
Equipe Lenom.AI`,
  },
];

const insertTemplate = db.prepare(
  `INSERT INTO email_templates (slug, name, description, subject, body) VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(slug) DO NOTHING`,
);
for (const t of TEMPLATES) insertTemplate.run(t.slug, t.name, t.description, t.subject, t.body);

/* ------------------------------------------------------------------ *
 * Configuração
 * ------------------------------------------------------------------ */

const DEFAULTS = {
  enabled: true,
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false,
  user: 'contato@cassiano3d.com.br',
  pass: '',
  fromName: 'Cassiano 3D',
  fromEmail: 'contato@cassiano3d.com.br',
  imapHost: 'imap.hostinger.com',
  imapPort: 993,
  imapSecure: true,
  notifyTo: '',
};

if (!setting('mail')) saveSetting('mail', DEFAULTS);

export function mailConfig() {
  return { ...DEFAULTS, ...(setting('mail') || {}) };
}

/** Configuração sem a senha, para o navegador. */
function publicConfig() {
  const { pass, ...rest } = mailConfig();
  return { ...rest, hasPass: !!pass };
}

const state = () => setting('mail_state') || { lastSync: null, lastError: '', spamRemote: 0 };
const setState = (patch) => saveSetting('mail_state', { ...state(), ...patch });

const isConfigured = (cfg) => !!(cfg.host && cfg.user && cfg.pass && cfg.fromEmail);

/* ------------------------------------------------------------------ *
 * Envio
 * ------------------------------------------------------------------ */

function transporter(cfg) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: Number(cfg.port),
    secure: !!cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function render(text, vars = {}) {
  return String(text ?? '')
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => (vars[key] ?? '').toString())
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/** Corpo em texto simples dentro do layout da marca. */
function layout(text, cfg) {
  const paragraphs = escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#f4f8f5;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e3ebe5;border-radius:14px" cellspacing="0" cellpadding="0">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e3ebe5;font-size:20px;font-weight:bold;color:#0b1f33">Lenom<span style="color:#2e8b3b">.AI</span></td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#33475b">${paragraphs}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e3ebe5;font-size:12px;color:#7a8a98">${escapeHtml(cfg.fromName)} · ${escapeHtml(cfg.fromEmail)}</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Envia, registra no histórico e guarda em "Enviados".
 * Lança o erro do SMTP para quem chamou decidir o que mostrar.
 */
export async function sendMail({ to, subject, text, template = '', inReplyTo = '', references = '' }) {
  const cfg = mailConfig();
  const log = db.prepare(
    'INSERT INTO mail_log (to_email, subject, template, status, error) VALUES (?, ?, ?, ?, ?)',
  );
  try {
    if (!cfg.enabled) throw new Error('O envio de e-mail está desativado nas configurações.');
    if (!isConfigured(cfg)) throw new Error('SMTP incompleto: preencha servidor, usuário e senha.');

    const info = await transporter(cfg).sendMail({
      from: { name: cfg.fromName, address: cfg.fromEmail },
      to,
      subject,
      text,
      html: layout(text, cfg),
      inReplyTo: inReplyTo || undefined,
      references: references || undefined,
    });

    log.run(to, subject, template, 'enviado', '');
    db.prepare(
      `INSERT INTO emails (folder, message_id, from_name, from_email, to_email, subject, snippet, text, seen, category, date)
       VALUES ('sent', ?, ?, ?, ?, ?, ?, ?, 1, 'contato', datetime('now'))`,
    ).run(info.messageId || '', cfg.fromName, cfg.fromEmail, to, subject, snippet(text), text);
    return info;
  } catch (err) {
    log.run(to || '', subject || '', template, 'falhou', String(err.message || err));
    throw err;
  }
}

function templateBySlug(slug) {
  return db.prepare('SELECT * FROM email_templates WHERE slug = ?').get(slug);
}

/** Disparos automáticos quando chega uma solicitação pelo site. Nunca derruba a requisição. */
export function notifyLead(lead) {
  const cfg = mailConfig();
  if (!cfg.enabled || !isConfigured(cfg)) return;

  const vars = {
    nome: lead.name,
    empresa: lead.company,
    email: lead.email,
    telefone: lead.phone,
    plano: lead.plan || 'Não informado',
    prazo: lead.deadline || 'Não informado',
    investimento: lead.budget || 'Não informado',
    mensagem: lead.message || '—',
  };

  const jobs = [];
  const confirm = templateBySlug('lead-confirmacao');
  if (confirm?.active && lead.email) {
    jobs.push({ to: lead.email, t: confirm });
  }
  const alert = templateBySlug('lead-aviso');
  if (alert?.active) jobs.push({ to: cfg.notifyTo || cfg.fromEmail, t: alert });

  for (const { to, t } of jobs) {
    sendMail({
      to,
      subject: render(t.subject, vars),
      text: render(t.body, vars),
      template: t.slug,
    }).catch((err) => console.error('[mail] falha ao enviar', t.slug, err.message));
  }
}

/* ------------------------------------------------------------------ *
 * Recebimento (IMAP)
 * ------------------------------------------------------------------ */

const SYNC_LIMIT = 150;

function imapClient(cfg) {
  return new ImapFlow({
    host: cfg.imapHost,
    port: Number(cfg.imapPort),
    secure: !!cfg.imapSecure,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });
}

function snippet(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function guessCategory(subject, text) {
  const s = `${subject} ${text}`.toLowerCase();
  if (/or[cç]amento|proposta|cota[cç][aã]o|pre[cç]o|valor|plano/.test(s)) return 'orcamento';
  if (/suporte|erro|problema|ajuda|bug|n[aã]o funciona|acesso|senha/.test(s)) return 'suporte';
  return 'contato';
}

let syncing = null;

/** Baixa as mensagens novas da Caixa de entrada e do Spam. Chamadas simultâneas compartilham a mesma execução. */
export function syncMail() {
  if (!syncing) syncing = runSync().finally(() => (syncing = null));
  return syncing;
}

async function runSync() {
  const cfg = mailConfig();
  if (!isConfigured(cfg)) throw new Error('Configure o SMTP (usuário e senha) antes de sincronizar.');

  const client = imapClient(cfg);
  let added = 0;
  try {
    await client.connect();
    const boxes = await client.list();
    const junk =
      boxes.find((b) => b.specialUse === '\\Junk') ||
      boxes.find((b) => /spam|junk|lixo eletr/i.test(b.path));
    const targets = [{ path: 'INBOX', folder: 'inbox' }];
    if (junk) targets.push({ path: junk.path, folder: 'spam' });

    const find = db.prepare('SELECT id FROM emails WHERE remote_folder = ? AND uid = ?');
    const flags = db.prepare('UPDATE emails SET seen = ?, answered = ? WHERE id = ?');
    const insert = db.prepare(
      `INSERT OR IGNORE INTO emails (folder, remote_folder, uid, message_id, from_name, from_email, to_email,
         subject, snippet, text, html, attachments, category, seen, answered, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    let spamRemote = 0;
    for (const target of targets) {
      const lock = await client.getMailboxLock(target.path);
      try {
        const total = client.mailbox?.exists || 0;
        if (target.folder === 'spam') spamRemote = total;
        if (!total) continue;

        const start = Math.max(1, total - SYNC_LIMIT + 1);
        const fresh = [];
        for await (const msg of client.fetch(`${start}:*`, { uid: true, flags: true })) {
          const row = find.get(target.path, msg.uid);
          const seen = msg.flags?.has('\\Seen') ? 1 : 0;
          const answered = msg.flags?.has('\\Answered') ? 1 : 0;
          if (row) flags.run(seen, answered, row.id);
          else fresh.push(msg.uid);
        }

        if (!fresh.length) continue;
        for await (const msg of client.fetch(
          fresh.join(','),
          { uid: true, flags: true, source: true, internalDate: true },
          { uid: true },
        )) {
          const mail = await simpleParser(msg.source);
          const from = mail.from?.value?.[0] || {};
          const text = mail.text || '';
          const subject = mail.subject || '(sem assunto)';
          const date = (mail.date || msg.internalDate || new Date()).toISOString().replace('T', ' ').slice(0, 19);
          const result = insert.run(
            target.folder,
            target.path,
            msg.uid,
            mail.messageId || '',
            from.name || '',
            from.address || '',
            mail.to?.text || '',
            subject,
            snippet(text),
            text,
            typeof mail.html === 'string' ? mail.html : '',
            JSON.stringify((mail.attachments || []).map((a) => a.filename || 'anexo')),
            guessCategory(subject, text),
            msg.flags?.has('\\Seen') ? 1 : 0,
            msg.flags?.has('\\Answered') ? 1 : 0,
            date,
          );
          added += Number(result.changes);
        }
      } finally {
        lock.release();
      }
    }

    setState({ lastSync: new Date().toISOString(), lastError: '', spamRemote });
    return { added };
  } catch (err) {
    setState({ lastError: String(err.message || err) });
    throw err;
  } finally {
    await client.logout().catch(() => {});
  }
}

/** Replica uma marcação (lida/respondida) no servidor de e-mail; falhas só vão para o log. */
async function addRemoteFlag(email, flag) {
  if (!email.remote_folder || !email.uid) return;
  const cfg = mailConfig();
  if (!isConfigured(cfg)) return;
  const client = imapClient(cfg);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(email.remote_folder);
    try {
      await client.messageFlagsAdd(String(email.uid), [flag], { uid: true });
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error('[mail] não foi possível marcar no servidor:', err.message);
  } finally {
    await client.logout().catch(() => {});
  }
}

let timer;
/** Sincroniza a cada 5 minutos enquanto o e-mail estiver configurado. */
export function startAutoSync() {
  clearInterval(timer);
  timer = setInterval(
    () => {
      const cfg = mailConfig();
      if (cfg.enabled && isConfigured(cfg)) syncMail().catch(() => {});
    },
    5 * 60 * 1000,
  );
  timer.unref?.();
}

/* ------------------------------------------------------------------ *
 * Rotas — montadas em /api/admin/mail (já autenticadas)
 * ------------------------------------------------------------------ */

export const mailRouter = Router();

const FOLDERS = ['inbox', 'spam', 'sent', 'archive', 'trash'];
const CATEGORIES = ['suporte', 'contato', 'orcamento'];
const one = (sql, ...args) => db.prepare(sql).get(...args).c;

mailRouter.get('/summary', (_req, res) => {
  const cfg = mailConfig();
  const st = state();
  res.json({
    inbox: one("SELECT COUNT(*) AS c FROM emails WHERE folder = 'inbox'"),
    unread: one("SELECT COUNT(*) AS c FROM emails WHERE folder = 'inbox' AND seen = 0"),
    answered: one("SELECT COUNT(*) AS c FROM emails WHERE folder = 'inbox' AND answered = 1"),
    spam: one("SELECT COUNT(*) AS c FROM emails WHERE folder = 'spam'"),
    sent: one("SELECT COUNT(*) AS c FROM emails WHERE folder = 'sent'"),
    archive: one("SELECT COUNT(*) AS c FROM emails WHERE folder = 'archive'"),
    trash: one("SELECT COUNT(*) AS c FROM emails WHERE folder = 'trash'"),
    spamRemote: st.spamRemote || 0,
    configured: isConfigured(cfg) && cfg.enabled,
    account: cfg.user,
    lastSync: st.lastSync,
    lastError: st.lastError,
  });
});

mailRouter.get('/messages', (req, res) => {
  const where = [];
  const args = [];
  const view = String(req.query.folder || 'inbox');

  if (view === 'unread') where.push("folder = 'inbox' AND seen = 0");
  else if (view === 'answered') where.push("folder = 'inbox' AND answered = 1");
  else {
    where.push('folder = ?');
    args.push(FOLDERS.includes(view) ? view : 'inbox');
  }

  if (CATEGORIES.includes(String(req.query.category))) {
    where.push('category = ?');
    args.push(req.query.category);
  }
  const search = String(req.query.search || '').trim();
  if (search) {
    where.push('(subject LIKE ? OR from_name LIKE ? OR from_email LIKE ? OR to_email LIKE ? OR snippet LIKE ?)');
    args.push(...Array(5).fill(`%${search}%`));
  }

  const perPage = Math.min(100, Math.max(5, Number(req.query.perPage) || 25));
  const page = Math.max(1, Number(req.query.page) || 1);
  const sql = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS c FROM emails WHERE ${sql}`).get(...args).c;
  const rows = db
    .prepare(
      `SELECT id, folder, from_name, from_email, to_email, subject, snippet, category, seen, answered,
              attachments != '[]' AS has_attachments, date
       FROM emails WHERE ${sql} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .all(...args, perPage, (page - 1) * perPage);

  res.json({ rows, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) });
});

mailRouter.get('/messages/:id', (req, res) => {
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
  if (!email) return res.status(404).json({ error: 'Mensagem não encontrada.' });
  if (!email.seen) {
    db.prepare('UPDATE emails SET seen = 1 WHERE id = ?').run(email.id);
    addRemoteFlag(email, '\\Seen');
    email.seen = 1;
  }
  res.json({ ...email, attachments: JSON.parse(email.attachments || '[]') });
});

mailRouter.patch('/messages/:id', (req, res) => {
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
  if (!email) return res.status(404).json({ error: 'Mensagem não encontrada.' });
  const { folder, category, seen } = req.body || {};
  if (folder && FOLDERS.includes(folder)) {
    db.prepare('UPDATE emails SET folder = ? WHERE id = ?').run(folder, email.id);
  }
  if (category && CATEGORIES.includes(category)) {
    db.prepare('UPDATE emails SET category = ? WHERE id = ?').run(category, email.id);
  }
  if (seen !== undefined) db.prepare('UPDATE emails SET seen = ? WHERE id = ?').run(seen ? 1 : 0, email.id);
  res.json({ ok: true });
});

mailRouter.delete('/messages/:id', (req, res) => {
  const email = db.prepare('SELECT folder FROM emails WHERE id = ?').get(req.params.id);
  if (!email) return res.status(404).json({ error: 'Mensagem não encontrada.' });
  if (email.folder !== 'trash') {
    return res.status(400).json({ error: 'Mova para a lixeira antes de excluir.' });
  }
  db.prepare('DELETE FROM emails WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

mailRouter.post('/messages/:id/reply', async (req, res) => {
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
  if (!email) return res.status(404).json({ error: 'Mensagem não encontrada.' });
  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Escreva a resposta.' });

  const subject = /^re:/i.test(email.subject) ? email.subject : `Re: ${email.subject}`;
  try {
    await sendMail({
      to: email.from_email,
      subject,
      text: body,
      template: 'resposta',
      inReplyTo: email.message_id,
      references: email.message_id,
    });
    db.prepare('UPDATE emails SET answered = 1 WHERE id = ?').run(email.id);
    addRemoteFlag(email, '\\Answered');
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: `Falha ao enviar: ${err.message}` });
  }
});

mailRouter.post('/send', async (req, res) => {
  const to = String(req.body?.to || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  if (!subject || !body) return res.status(400).json({ error: 'Preencha assunto e mensagem.' });
  try {
    await sendMail({ to, subject, text: body, template: String(req.body?.template || '') });
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: `Falha ao enviar: ${err.message}` });
  }
});

mailRouter.post('/sync', async (_req, res) => {
  try {
    res.json(await syncMail());
  } catch (err) {
    res.status(502).json({ error: `Falha ao sincronizar: ${err.message}` });
  }
});

mailRouter.get('/templates', (_req, res) => {
  res.json(db.prepare('SELECT * FROM email_templates ORDER BY id').all());
});

mailRouter.put('/templates/:id', requireAdmin, (req, res) => {
  const t = db.prepare('SELECT id FROM email_templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Template não encontrado.' });
  const { name, subject, body, active } = req.body || {};
  db.prepare(
    `UPDATE email_templates SET name = ?, subject = ?, body = ?, active = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(String(name || ''), String(subject || ''), String(body || ''), active ? 1 : 0, t.id);
  res.json(db.prepare('SELECT * FROM email_templates WHERE id = ?').get(t.id));
});

mailRouter.get('/log', (req, res) => {
  const perPage = Math.min(100, Math.max(5, Number(req.query.perPage) || 20));
  const page = Math.max(1, Number(req.query.page) || 1);
  const status = ['enviado', 'falhou'].includes(req.query.status) ? req.query.status : '';
  const where = status ? 'WHERE status = ?' : '';
  const args = status ? [status] : [];
  const total = db.prepare(`SELECT COUNT(*) AS c FROM mail_log ${where}`).get(...args).c;
  const rows = db
    .prepare(`SELECT * FROM mail_log ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...args, perPage, (page - 1) * perPage);
  res.json({ rows, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) });
});

mailRouter.get('/config', requireAdmin, (_req, res) => res.json(publicConfig()));

mailRouter.put('/config', requireAdmin, (req, res) => {
  const b = req.body || {};
  const current = mailConfig();
  const next = {
    enabled: !!b.enabled,
    host: String(b.host || '').trim(),
    port: Number(b.port) || 587,
    secure: !!b.secure,
    user: String(b.user || '').trim(),
    // Senha em branco mantém a atual.
    pass: b.pass ? String(b.pass) : current.pass,
    fromName: String(b.fromName || '').trim(),
    fromEmail: String(b.fromEmail || '').trim(),
    imapHost: String(b.imapHost || '').trim(),
    imapPort: Number(b.imapPort) || 993,
    imapSecure: !!b.imapSecure,
    notifyTo: String(b.notifyTo || '').trim(),
  };
  saveSetting('mail', next);
  res.json(publicConfig());
});

mailRouter.post('/test-connection', requireAdmin, async (_req, res) => {
  const cfg = mailConfig();
  if (!isConfigured(cfg)) return res.status(400).json({ error: 'Preencha e salve servidor, usuário e senha.' });
  const result = { smtp: '', imap: '' };
  try {
    await transporter(cfg).verify();
    result.smtp = 'ok';
  } catch (err) {
    result.smtp = err.message;
  }
  const client = imapClient(cfg);
  try {
    await client.connect();
    result.imap = 'ok';
  } catch (err) {
    result.imap = err.message;
  } finally {
    await client.logout().catch(() => {});
  }
  res.status(result.smtp === 'ok' && result.imap === 'ok' ? 200 : 502).json(result);
});

mailRouter.post('/test-send', requireAdmin, async (req, res) => {
  const to = String(req.body?.to || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  try {
    await sendMail({
      to,
      subject: 'Teste de envio — Lenom.AI',
      text: 'Este é um e-mail de teste enviado pelo painel da Lenom.AI.\n\nSe você recebeu, o SMTP está funcionando.',
      template: 'teste',
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: `Falha ao enviar: ${err.message}` });
  }
});
