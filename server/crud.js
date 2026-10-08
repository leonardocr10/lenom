import { db } from './db.js';

/**
 * Consulta paginada com busca, filtros e ordenação.
 * Nomes de coluna nunca vêm do cliente sem passar pela whitelist do recurso.
 */
export function listQuery(table, query, config) {
  const { columns, searchable, filterable, defaultSort } = config;

  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10));
  const sort = columns.includes(query.sort) ? query.sort : defaultSort;
  const dir = String(query.dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const where = [];
  const params = [];

  const term = (query.search || '').trim();
  if (term && searchable.length) {
    where.push(`(${searchable.map((c) => `${c} LIKE ?`).join(' OR ')})`);
    searchable.forEach(() => params.push(`%${term}%`));
  }

  for (const col of filterable) {
    const value = query[`filter_${col}`];
    if (value === undefined || value === '') continue;
    where.push(`${col} = ?`);
    params.push(value);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS c FROM ${table} ${clause}`).get(...params).c;
  const rows = db
    .prepare(`SELECT * FROM ${table} ${clause} ORDER BY ${sort} ${dir}, id ASC LIMIT ? OFFSET ?`)
    .all(...params, perPage, (page - 1) * perPage);

  return { rows, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export function getOne(table, id) {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(Number(id));
}

export function insert(table, data) {
  const keys = Object.keys(data);
  const info = db
    .prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
    .run(...keys.map((k) => data[k]));
  return getOne(table, info.lastInsertRowid);
}

export function update(table, id, data) {
  const keys = Object.keys(data);
  if (!keys.length) return getOne(table, id);
  db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(
    ...keys.map((k) => data[k]),
    Number(id),
  );
  return getOne(table, id);
}

export function remove(table, id) {
  return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(Number(id)).changes > 0;
}

/** Converte o corpo da requisição no formato da tabela, campo a campo. */
export function pick(body, fields) {
  const out = {};
  for (const [name, cast] of Object.entries(fields)) {
    if (body[name] === undefined) continue;
    out[name] = cast(body[name]);
  }
  return out;
}

export const asText = (v) => (v === null || v === undefined ? '' : String(v));
export const asInt = (v) => Number(v) || 0;
export const asBool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);
export const asJson = (v) => JSON.stringify(v ?? []);
