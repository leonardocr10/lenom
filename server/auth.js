import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const SECRET = process.env.JWT_SECRET || 'lenom-dev-secret-trocar-em-producao';
const EXPIRES = '8h';

export function signIn(email, password) {
  const user = db
    .prepare('SELECT * FROM users WHERE email = ? AND active = 1')
    .get(String(email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) return null;

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  return { token: jwt.sign(payload, SECRET, { expiresIn: EXPIRES }), user: payload };
}

export function hash(password) {
  return bcrypt.hashSync(String(password), 10);
}

/** Exige um token válido; anexa o usuário em `req.user`. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }
}

/** Apenas administradores podem gerir usuários. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem fazer isso.' });
  }
  next();
}
