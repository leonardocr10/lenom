import { asBool, asInt, asJson, asText } from './crud.js';

/**
 * Cada recurso declara: tabela, colunas ordenáveis, campos de busca e filtro,
 * como o corpo da requisição vira linha e quais colunas são JSON.
 */
export const resources = {
  plans: {
    table: 'plans',
    label: 'Planos',
    columns: ['id', 'name', 'price', 'position', 'featured', 'published', 'updated_at'],
    searchable: ['name', 'descr', 'price'],
    filterable: ['featured', 'published'],
    defaultSort: 'position',
    json: ['features'],
    fields: {
      name: asText,
      descr: asText,
      price: asText,
      unit: asText,
      cta: asText,
      features: asJson,
      featured: asBool,
      position: asInt,
      published: asBool,
    },
  },
  faq: {
    table: 'faq',
    label: 'Perguntas frequentes',
    columns: ['id', 'q', 'position', 'published', 'updated_at'],
    searchable: ['q', 'a'],
    filterable: ['published'],
    defaultSort: 'position',
    json: [],
    fields: { q: asText, a: asText, position: asInt, published: asBool },
  },
  portfolio: {
    table: 'portfolio',
    label: 'Portfólio',
    columns: ['id', 'title', 'tag', 'position', 'published', 'updated_at'],
    searchable: ['title', 'descr', 'tag'],
    filterable: ['tag', 'published'],
    defaultSort: 'position',
    json: ['modules'],
    fields: {
      tag: asText,
      title: asText,
      descr: asText,
      image: asText,
      modules: asJson,
      position: asInt,
      published: asBool,
    },
  },
  testimonials: {
    table: 'testimonials',
    label: 'Depoimentos',
    columns: ['id', 'company', 'role', 'position', 'published', 'updated_at'],
    searchable: ['quote', 'role', 'company'],
    filterable: ['published'],
    defaultSort: 'position',
    json: [],
    fields: { quote: asText, role: asText, company: asText, position: asInt, published: asBool },
  },
  story: {
    table: 'story_chapters',
    label: 'Capítulos da história',
    columns: ['id', 'n', 'title', 'position', 'published', 'updated_at'],
    searchable: ['title', 'title_accent', 'text', 'eyebrow'],
    filterable: ['published'],
    defaultSort: 'position',
    json: ['chips', 'ctas'],
    fields: {
      n: asText,
      eyebrow: asText,
      title: asText,
      title_accent: asText,
      text: asText,
      chips: asJson,
      ctas: asJson,
      position: asInt,
      published: asBool,
    },
  },
  leads: {
    table: 'leads',
    label: 'Solicitações de orçamento',
    columns: ['id', 'name', 'email', 'status', 'budget', 'deadline', 'created_at'],
    searchable: ['name', 'company', 'email', 'phone', 'message'],
    filterable: ['status', 'budget', 'deadline', 'plan'],
    defaultSort: 'created_at',
    json: ['topics'],
    fields: { status: asText, notes: asText },
  },
  users: {
    table: 'users',
    label: 'Usuários',
    columns: ['id', 'name', 'email', 'role', 'active', 'created_at'],
    searchable: ['name', 'email'],
    filterable: ['role', 'active'],
    defaultSort: 'name',
    json: [],
    fields: { name: asText, email: asText, role: asText, active: asBool },
  },
  media: {
    table: 'media',
    label: 'Mídia',
    columns: ['id', 'original_name', 'mime', 'size', 'created_at'],
    searchable: ['original_name', 'mime'],
    filterable: ['mime'],
    defaultSort: 'created_at',
    json: [],
    fields: {},
  },
};

/** Expande as colunas JSON e esconde o hash de senha. */
export function expand(resource, row) {
  if (!row) return row;
  const out = { ...row };
  delete out.password_hash;
  for (const key of resource.json) {
    try {
      out[key] = JSON.parse(out[key] ?? '[]');
    } catch {
      out[key] = [];
    }
  }
  return out;
}
