import { GridColumn } from '../ui/data-grid';

export type FieldType =
  'text' | 'textarea' | 'number' | 'bool' | 'select' | 'list' | 'password' | 'image' | 'readonly';

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: string[];
  rows?: number;
  /** Ocupa a linha inteira do formulário. */
  wide?: boolean;
  /** Só aparece na criação. */
  onCreate?: boolean;
}

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface ResourceConfig {
  resource: string;
  title: string;
  subtitle: string;
  singular: string;
  columns: GridColumn[];
  fields: FormField[];
  filters: FilterDef[];
  defaultSort: string;
  defaultDir: 'asc' | 'desc';
  canCreate: boolean;
  canDelete: boolean;
  searchPlaceholder: string;
}

const PUBLISHED_FILTER: FilterDef = {
  key: 'published',
  label: 'Situação',
  options: [
    { value: '1', label: 'Publicado' },
    { value: '0', label: 'Rascunho' },
  ],
};

const PUBLISHED_FIELDS: FormField[] = [
  { key: 'position', label: 'Ordem', type: 'number', hint: 'Menor número aparece primeiro.' },
  { key: 'published', label: 'Publicado no site', type: 'bool' },
];

export const RESOURCES: Record<string, ResourceConfig> = {
  plans: {
    resource: 'plans',
    title: 'Planos e preços',
    subtitle: 'Os cartões da seção de planos da landing page.',
    singular: 'plano',
    defaultSort: 'position',
    defaultDir: 'asc',
    canCreate: true,
    canDelete: true,
    searchPlaceholder: 'Buscar por nome, descrição ou preço',
    columns: [
      { key: 'position', label: '#', width: '70px' },
      { key: 'name', label: 'Plano' },
      { key: 'price', label: 'Preço', width: '130px' },
      { key: 'featured', label: 'Destaque', type: 'bool', width: '120px' },
      { key: 'published', label: 'Situação', type: 'bool', width: '120px' },
      { key: 'updated_at', label: 'Atualizado', type: 'date', width: '160px' },
    ],
    filters: [
      PUBLISHED_FILTER,
      {
        key: 'featured',
        label: 'Destaque',
        options: [
          { value: '1', label: 'Em destaque' },
          { value: '0', label: 'Normal' },
        ],
      },
    ],
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'price', label: 'Preço', type: 'text', required: true, hint: 'Ex.: R$ 2.490' },
      { key: 'unit', label: 'Unidade', type: 'text', hint: 'Ex.: /mês (opcional)' },
      { key: 'cta', label: 'Texto do botão', type: 'text' },
      { key: 'descr', label: 'Descrição', type: 'textarea', rows: 2, wide: true },
      {
        key: 'features',
        label: 'Itens inclusos',
        type: 'list',
        wide: true,
        hint: 'Um item por linha.',
      },
      { key: 'featured', label: 'Destacar este plano', type: 'bool' },
      ...PUBLISHED_FIELDS,
    ],
  },

  faq: {
    resource: 'faq',
    title: 'Perguntas frequentes',
    subtitle: 'As perguntas exibidas na seção de FAQ.',
    singular: 'pergunta',
    defaultSort: 'position',
    defaultDir: 'asc',
    canCreate: true,
    canDelete: true,
    searchPlaceholder: 'Buscar na pergunta ou na resposta',
    columns: [
      { key: 'position', label: '#', width: '70px' },
      { key: 'q', label: 'Pergunta' },
      { key: 'published', label: 'Situação', type: 'bool', width: '120px' },
      { key: 'updated_at', label: 'Atualizado', type: 'date', width: '160px' },
    ],
    filters: [PUBLISHED_FILTER],
    fields: [
      { key: 'q', label: 'Pergunta', type: 'text', required: true, wide: true },
      { key: 'a', label: 'Resposta', type: 'textarea', required: true, rows: 4, wide: true },
      ...PUBLISHED_FIELDS,
    ],
  },

  portfolio: {
    resource: 'portfolio',
    title: 'Portfólio',
    subtitle: 'Os projetos apresentados na vitrine.',
    singular: 'projeto',
    defaultSort: 'position',
    defaultDir: 'asc',
    canCreate: true,
    canDelete: true,
    searchPlaceholder: 'Buscar por título, descrição ou tag',
    columns: [
      { key: 'position', label: '#', width: '70px' },
      { key: 'title', label: 'Projeto' },
      { key: 'tag', label: 'Tag', type: 'badge', width: '150px' },
      { key: 'image', label: 'Capa', type: 'thumb', width: '90px', sortable: false },
      { key: 'published', label: 'Situação', type: 'bool', width: '120px' },
      { key: 'updated_at', label: 'Atualizado', type: 'date', width: '160px' },
    ],
    filters: [PUBLISHED_FILTER],
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'tag', label: 'Tag', type: 'text', hint: 'Ex.: Sistema, Landing Page' },
      {
        key: 'image',
        label: 'Foto de capa',
        type: 'image',
        wide: true,
        hint: 'JPG, PNG ou WebP até 5 MB. Proporção 16:10 fica melhor no card.',
      },
      { key: 'descr', label: 'Descrição', type: 'textarea', rows: 3, wide: true },
      {
        key: 'modules',
        label: 'Módulos',
        type: 'list',
        wide: true,
        hint: 'Um por linha. Aparecem como chips no card em destaque.',
      },
      ...PUBLISHED_FIELDS,
    ],
  },

  testimonials: {
    resource: 'testimonials',
    title: 'Depoimentos',
    subtitle: 'As falas de clientes exibidas na landing page.',
    singular: 'depoimento',
    defaultSort: 'position',
    defaultDir: 'asc',
    canCreate: true,
    canDelete: true,
    searchPlaceholder: 'Buscar por texto, cargo ou empresa',
    columns: [
      { key: 'position', label: '#', width: '70px' },
      { key: 'company', label: 'Empresa' },
      { key: 'role', label: 'Cargo' },
      { key: 'published', label: 'Situação', type: 'bool', width: '120px' },
      { key: 'updated_at', label: 'Atualizado', type: 'date', width: '160px' },
    ],
    filters: [PUBLISHED_FILTER],
    fields: [
      { key: 'company', label: 'Empresa', type: 'text', required: true },
      { key: 'role', label: 'Cargo', type: 'text' },
      { key: 'quote', label: 'Depoimento', type: 'textarea', required: true, rows: 4, wide: true },
      ...PUBLISHED_FIELDS,
    ],
  },

  story: {
    resource: 'story',
    title: 'Capítulos da história',
    subtitle: 'A narrativa em capítulos da seção "Como funciona".',
    singular: 'capítulo',
    defaultSort: 'position',
    defaultDir: 'asc',
    canCreate: true,
    canDelete: true,
    searchPlaceholder: 'Buscar por título ou texto',
    columns: [
      { key: 'position', label: '#', width: '70px' },
      { key: 'n', label: 'Nº', width: '80px' },
      { key: 'title', label: 'Título' },
      { key: 'published', label: 'Situação', type: 'bool', width: '120px' },
      { key: 'updated_at', label: 'Atualizado', type: 'date', width: '160px' },
    ],
    filters: [PUBLISHED_FILTER],
    fields: [
      { key: 'n', label: 'Número', type: 'text', hint: 'Ex.: 01' },
      { key: 'eyebrow', label: 'Rótulo', type: 'text', hint: 'Ex.: 01 — O CENÁRIO' },
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'title_accent', label: 'Título em destaque', type: 'text' },
      { key: 'text', label: 'Texto', type: 'textarea', rows: 3, wide: true },
      { key: 'chips', label: 'Chips', type: 'list', wide: true, hint: 'Um por linha.' },
      ...PUBLISHED_FIELDS,
    ],
  },

  leads: {
    resource: 'leads',
    title: 'Solicitações de orçamento',
    subtitle: 'Tudo que chega pelo formulário da landing page.',
    singular: 'solicitação',
    defaultSort: 'created_at',
    defaultDir: 'desc',
    canCreate: false,
    canDelete: true,
    searchPlaceholder: 'Buscar por nome, empresa, e-mail, telefone ou mensagem',
    columns: [
      { key: 'created_at', label: 'Recebido', type: 'date', width: '160px' },
      { key: 'name', label: 'Nome' },
      { key: 'email', label: 'E-mail' },
      { key: 'budget', label: 'Investimento', width: '170px' },
      { key: 'deadline', label: 'Prazo', width: '140px' },
      { key: 'status', label: 'Status', type: 'badge', width: '130px' },
    ],
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'novo', label: 'Novo' },
          { value: 'em contato', label: 'Em contato' },
          { value: 'proposta enviada', label: 'Proposta enviada' },
          { value: 'fechado', label: 'Fechado' },
          { value: 'perdido', label: 'Perdido' },
        ],
      },
      {
        key: 'deadline',
        label: 'Prazo',
        options: [
          { value: 'Urgente', label: 'Urgente' },
          { value: '30 dias', label: '30 dias' },
          { value: '60 dias', label: '60 dias' },
          { value: '90 dias', label: '90 dias' },
          { value: 'Sem prazo definido', label: 'Sem prazo definido' },
        ],
      },
    ],
    fields: [
      { key: 'name', label: 'Nome', type: 'readonly' },
      { key: 'company', label: 'Empresa', type: 'readonly' },
      { key: 'email', label: 'E-mail', type: 'readonly' },
      { key: 'phone', label: 'Telefone', type: 'readonly' },
      { key: 'plan', label: 'Plano de interesse', type: 'readonly' },
      { key: 'budget', label: 'Investimento', type: 'readonly' },
      { key: 'deadline', label: 'Prazo', type: 'readonly' },
      { key: 'topics', label: 'Tipos de projeto', type: 'readonly', wide: true },
      { key: 'message', label: 'Objetivo do projeto', type: 'readonly', wide: true },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['novo', 'em contato', 'proposta enviada', 'fechado', 'perdido'],
      },
      { key: 'notes', label: 'Anotações internas', type: 'textarea', rows: 4, wide: true },
    ],
  },

  users: {
    resource: 'users',
    title: 'Usuários',
    subtitle: 'Quem pode acessar este painel.',
    singular: 'usuário',
    defaultSort: 'name',
    defaultDir: 'asc',
    canCreate: true,
    canDelete: true,
    searchPlaceholder: 'Buscar por nome ou e-mail',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'email', label: 'E-mail' },
      { key: 'role', label: 'Perfil', type: 'badge', width: '130px' },
      { key: 'active', label: 'Ativo', type: 'bool', width: '110px' },
      { key: 'created_at', label: 'Criado em', type: 'date', width: '160px' },
    ],
    filters: [
      {
        key: 'role',
        label: 'Perfil',
        options: [
          { value: 'admin', label: 'Administrador' },
          { value: 'editor', label: 'Editor' },
        ],
      },
      {
        key: 'active',
        label: 'Situação',
        options: [
          { value: '1', label: 'Ativo' },
          { value: '0', label: 'Inativo' },
        ],
      },
    ],
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'E-mail', type: 'text', required: true },
      { key: 'role', label: 'Perfil', type: 'select', options: ['editor', 'admin'] },
      {
        key: 'password',
        label: 'Senha',
        type: 'password',
        hint: 'Mínimo de 6 caracteres. Em branco na edição mantém a senha atual.',
      },
      { key: 'active', label: 'Usuário ativo', type: 'bool' },
    ],
  },
};
