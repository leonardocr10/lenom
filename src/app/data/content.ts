export type Point = [x: number, y: number];

export interface PortfolioItem {
  tag: string;
  title: string;
  desc: string;
  /** Módulos exibidos como chips no card em destaque. */
  modules?: string[];
  /** Foto de capa enviada pelo painel; sem ela o card usa a arte padrão. */
  image?: string;
}

export interface Plan {
  name: string;
  featured?: boolean;
  desc: string;
  price: string;
  unit: string;
  cta: string;
  features: string[];
}

export interface Testimonial {
  quote: string;
  role: string;
  company: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LogoLetter {
  letter: string;
  word: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface StoryCta {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
}

export interface StoryChapter {
  n: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  text: string;
  chips?: string[];
  ctas?: StoryCta[];
}

export interface StageNode {
  mono: string;
  color: string;
  label: string;
  from: Point;
  to: Point;
  rot: number;
}

export interface ManualTask {
  text: string;
  pos: Point;
  rot: number;
}

export interface LogEntry {
  text: string;
  time: string;
}

export interface DashboardKpi {
  value: string;
  label: string;
  accent?: boolean;
}

export interface DashboardBar {
  d: string;
  v: number;
}

export interface StageProduct {
  title: string;
  price: string;
  shot: string;
}

/** Chaves de ícone resolvidas em SVG inline pelo template do orçamento. */
export type QuoteIcon = 'bolt' | 'doc' | 'lock' | 'chat' | 'people' | 'rocket' | 'chart' | 'shield';

export interface QuoteTrust {
  icon: QuoteIcon;
  line1: string;
  line2: string;
}

export interface QuoteStep {
  n: string;
  icon: QuoteIcon;
  title: string;
  note: string;
}

export interface QuoteBenefit {
  icon: QuoteIcon;
  title: string;
  text: string;
}

export interface Content {
  portfolio: PortfolioItem[];
  plans: Plan[];
  testimonials: Testimonial[];
  faq: FaqItem[];
  contactTopics: string[];
  storyHeader: { eyebrow: string; title: string; titleLead: string; titleAccent: string };
  storyIntro: string;
  quote: {
    plans: string[];
    deadlines: string[];
    budgets: string[];
    trust: QuoteTrust[];
    steps: QuoteStep[];
    benefits: QuoteBenefit[];
  };
  logoMeaning: LogoLetter[];
  nav: NavItem[];
  storyChapters: StoryChapter[];
  stage: {
    nodes: StageNode[];
    manualTasks: ManualTask[];
    log: LogEntry[];
    dashboard: { kpis: DashboardKpi[]; bars: DashboardBar[]; note: string };
    products: StageProduct[];
  };
  contact: {
    whatsapp: string;
    email: string;
    city: string;
    cityNote: string;
    hours: string;
    /** Link direto montado a partir de `whatsapp`; usado por todo botão de WhatsApp. */
    whatsappUrl: string;
  };
}

export const content: Content = {
  portfolio: [
    {
      tag: 'E-COMMERCE + ERP',
      title: 'Cassiano3D',
      modules: [
        'E-commerce',
        'Produtos',
        'Estoque',
        'Compras',
        'Fiscal',
        'Financeiro',
        'Marketing',
        'Administração',
      ],
      desc: 'Sistema completo com e-commerce, produtos, estoque, compras, fiscal, financeiro, marketing e administração.',
    },
    {
      tag: 'SISTEMA SOB MEDIDA',
      title: 'Sistema administrativo',
      desc: 'Painel web para controle de clientes, projetos, financeiro e relatórios, com perfis de acesso por equipe.',
    },
    {
      tag: 'WEBSITE',
      title: 'Site institucional',
      desc: 'Site responsivo, com páginas de serviços, blog, formulários e integração com WhatsApp.',
    },
    {
      tag: 'CONVERSÃO',
      title: 'Landing Page',
      desc: 'Landing page de alta conversão para campanha de captação, integrada a formulário, WhatsApp e pixels.',
    },
  ],
  plans: [
    {
      name: 'Landing Page',
      desc: 'Ideal para campanhas, lançamentos e captação de leads.',
      price: 'R$ 1.290',
      unit: '',
      cta: 'Quero este plano',
      features: [
        'Página moderna e profissional',
        'Formulário de contato',
        'Botão WhatsApp',
        'Totalmente responsivo',
        'SEO básico',
        'Integração com redes sociais',
      ],
    },
    {
      name: 'Site Institucional',
      featured: true,
      desc: 'Presença digital completa para apresentar sua empresa.',
      price: 'R$ 2.490',
      unit: '',
      cta: 'Quero este plano',
      features: [
        'Até 6 páginas',
        'Painel de gerenciamento básico',
        'SEO inicial',
        'Formulários',
        'WhatsApp',
        'Totalmente responsivo',
        'Integração com Analytics',
      ],
    },
    {
      name: 'Sistema sob medida',
      desc: 'Software desenvolvido para os processos da sua empresa.',
      price: 'R$ 6.900',
      unit: '',
      cta: 'Solicitar orçamento',
      features: [
        'Análise de requisitos',
        'Desenvolvimento personalizado',
        'Painel administrativo',
        'Banco de dados',
        'Implantação',
        'Treinamento',
        'Suporte inicial',
      ],
    },
    {
      name: 'Plano SaaS',
      desc: 'Sistema pronto em nuvem, com mensalidade acessível.',
      price: 'R$ 297',
      unit: '/mês',
      cta: 'Conhecer o SaaS',
      features: [
        'Sistema em nuvem',
        'Atualizações',
        'Hospedagem',
        'Suporte técnico',
        'Backup',
        'Melhorias contínuas',
      ],
    },
  ],
  testimonials: [
    {
      quote:
        'A Lenom.AI entendeu exatamente como nossa operação funcionava e entregou um sistema que simplificou o dia a dia da equipe.',
      role: 'Gestor comercial',
      company: 'Empresa de varejo',
    },
    {
      quote:
        'Nosso novo site ficou moderno, rápido e passou a gerar contatos pelo WhatsApp logo nas primeiras semanas.',
      role: 'Sócia-diretora',
      company: 'Escritório de serviços',
    },
    {
      quote:
        'Atendimento próximo, prazos cumpridos e suporte mesmo depois da entrega. Recomendamos o trabalho.',
      role: 'Coordenador de operações',
      company: 'Indústria',
    },
  ],
  faq: [
    {
      q: 'Quanto custa um site?',
      a: 'Landing pages a partir de R$ 1.290 e sites institucionais a partir de R$ 2.490. O valor final depende do escopo — enviamos uma proposta detalhada, sem compromisso.',
    },
    {
      q: 'Vocês automatizam as ferramentas que eu já uso?',
      a: 'Sim. Integramos site, WhatsApp, e-mail, CRM e planilhas a um único motor de automação, com integrações via API — sem trocar o que já funciona.',
    },
    {
      q: 'Vocês desenvolvem sistemas personalizados?',
      a: 'Sim. Fazemos o levantamento de requisitos e desenvolvemos o sistema de acordo com os processos da sua empresa, com painel administrativo e controle de acesso.',
    },
    {
      q: 'O sistema fica em nuvem?',
      a: 'Sim. Hospedamos em infraestrutura em nuvem, com backups periódicos, monitoramento e acesso de qualquer lugar.',
    },
    {
      q: 'Existe suporte após a entrega?',
      a: 'Sim. Todos os projetos incluem suporte inicial, e oferecemos planos de manutenção contínua.',
    },
    {
      q: 'O projeto é responsivo?',
      a: 'Sim. Todos os projetos são pensados para celular, tablet e desktop desde o início.',
    },
  ],
  contactTopics: [
    'Site',
    'E-commerce',
    'Sistema',
    'SaaS',
    'Landing Page',
    'Integração',
    'Automação',
    'Outro',
  ],
  storyHeader: {
    eyebrow: 'COMO FUNCIONA',
    title: 'Ferramentas soltas',
    titleLead: 'viram',
    titleAccent: 'um só fluxo.',
  },
  storyIntro:
    'Leads no formulário, pedidos no WhatsApp, números na planilha — e sua equipe copiando tudo de um lugar para outro. Resolvemos isso em três etapas.',
  quote: {
    plans: [
      'Ainda não sei',
      'Landing Page — R$ 1.290',
      'Site institucional — R$ 2.490',
      'Sistema sob medida — R$ 6.900',
      'Plano SaaS — R$ 297/mês',
    ],
    deadlines: ['Urgente', '30 dias', '60 dias', '90 dias', 'Sem prazo definido'],
    budgets: [
      'Até R$ 2.000',
      'R$ 2.000–5.000',
      'R$ 5.000–10.000',
      'R$ 10.000–25.000',
      'Acima de R$ 25.000',
    ],
    trust: [
      { icon: 'bolt', line1: 'Resposta em', line2: 'até 1 dia útil' },
      { icon: 'doc', line1: 'Proposta sem', line2: 'compromisso' },
      { icon: 'lock', line1: 'Seus dados', line2: 'são protegidos' },
    ],
    steps: [
      {
        n: '1',
        icon: 'chat',
        title: 'Analisamos sua solicitação',
        note: 'em até 1 dia útil.',
      },
      {
        n: '2',
        icon: 'people',
        title: 'Agendamos uma conversa',
        note: 'para entender os detalhes.',
      },
      {
        n: '3',
        icon: 'doc',
        title: 'Enviamos uma proposta',
        note: 'com escopo, prazo e investimento.',
      },
    ],
    benefits: [
      {
        icon: 'rocket',
        title: 'Projetos sob medida',
        text: 'Soluções alinhadas aos seus objetivos.',
      },
      {
        icon: 'chart',
        title: 'Comunicação transparente',
        text: 'Acompanhamento em todas as etapas.',
      },
      {
        icon: 'shield',
        title: 'Foco em resultados',
        text: 'Tecnologia para o crescimento do seu negócio.',
      },
    ],
  },
  logoMeaning: [
    {
      letter: 'L',
      word: 'Lógica',
    },
    {
      letter: 'e',
      word: 'Eficiência',
    },
    {
      letter: 'n',
      word: 'Negócios',
    },
    {
      letter: 'o',
      word: 'Otimização',
    },
    {
      letter: 'm',
      word: 'Modernização',
    },
  ],
  nav: [
    {
      label: 'Como funciona',
      href: '#historia',
    },
    {
      label: 'Portfólio',
      href: '#portfolio',
    },
    {
      label: 'Planos e preços',
      href: '#planos',
    },
    {
      label: 'Dúvidas',
      href: '#faq',
    },
  ],
  storyChapters: [
    {
      n: '01',
      eyebrow: '01 — CONECTAMOS',
      title: 'Conectamos',
      titleAccent: '',
      text: 'Integramos site, WhatsApp, e-mail, CRM e planilhas a um único motor de automação, com integrações via API.',
      chips: ['Integração via API', 'Dados centralizados', 'Sem retrabalho'],
    },
    {
      n: '02',
      eyebrow: '02 — AUTOMATIZAMOS',
      title: 'Automatizamos',
      titleAccent: '',
      text: 'Cada evento dispara um fluxo: o lead vira contato no CRM, o pedido é confirmado na hora e o relatório chega pronto na segunda de manhã.',
    },
    {
      n: '03',
      eyebrow: '03 — VOCÊ ACOMPANHA',
      title: 'Você acompanha',
      titleAccent: '',
      text: 'Painéis e relatórios gerenciais mostram o impacto em tempo real, com perfis de acesso para cada equipe.',
    },
  ],
  stage: {
    nodes: [
      {
        mono: 'WA',
        color: '#1FA855',
        label: 'WhatsApp',
        from: [16, 22],
        to: [22, 16],
        rot: -8,
      },
      {
        mono: 'FS',
        color: '#2E8B3B',
        label: 'Formulário',
        from: [34, 70],
        to: [14, 46],
        rot: 6,
      },
      {
        mono: 'GM',
        color: '#C8463B',
        label: 'Gmail',
        from: [72, 34],
        to: [22, 68],
        rot: -5,
      },
      {
        mono: 'CR',
        color: '#D9663F',
        label: 'CRM',
        from: [26, 46],
        to: [78, 16],
        rot: 9,
      },
      {
        mono: 'PL',
        color: '#178A54',
        label: 'Planilhas',
        from: [80, 72],
        to: [86, 46],
        rot: -10,
      },
      {
        mono: 'SL',
        color: '#7A4FC0',
        label: 'Slack',
        from: [58, 14],
        to: [78, 68],
        rot: 5,
      },
    ],
    manualTasks: [
      {
        text: 'Copiar lead para a planilha',
        pos: [52, 44],
        rot: -3,
      },
      {
        text: 'Responder pedido no WhatsApp',
        pos: [58, 59],
        rot: 4,
      },
      {
        text: 'Montar relatório de sexta',
        pos: [46, 85],
        rot: -2,
      },
    ],
    log: [
      {
        text: 'Lead salvo no CRM e na planilha',
        time: '+0.4s',
      },
      {
        text: 'Pedido confirmado no WhatsApp',
        time: '+1.1s',
      },
      {
        text: 'Relatório enviado à diretoria',
        time: 'seg 08:00',
      },
    ],
    dashboard: {
      kpis: [
        {
          value: '1.284',
          label: 'tarefas automatizadas',
        },
        {
          value: '62 h',
          label: 'economizadas pela equipe',
          accent: true,
        },
        {
          value: '< 1 min',
          label: 'resposta a novos leads',
        },
      ],
      bars: [
        {
          d: 'SEG',
          v: 38,
        },
        {
          d: 'TER',
          v: 52,
        },
        {
          d: 'QUA',
          v: 46,
        },
        {
          d: 'QUI',
          v: 70,
        },
        {
          d: 'SEX',
          v: 64,
        },
        {
          d: 'SÁB',
          v: 82,
        },
        {
          d: 'DOM',
          v: 90,
        },
      ],
      note: 'DADOS ILUSTRATIVOS',
    },
    products: [
      {
        title: 'Landing Pages',
        price: 'A partir de R$ 1.290',
        shot: 'landing page',
      },
      {
        title: 'Sistemas sob medida',
        price: 'A partir de R$ 6.900',
        shot: 'sistema',
      },
      {
        title: 'Plano SaaS',
        price: 'A partir de R$ 297/mês',
        shot: 'saas',
      },
    ],
  },
  contact: {
    whatsapp: '(11) 98765-4321',
    email: 'contato@lenom.ai',
    city: 'São Paulo - SP',
    cityNote: 'Atendimento em todo o Brasil',
    hours: 'Segunda a sexta, das 9h às 18h',
    whatsappUrl: '',
  },
};

/** Monta o link do WhatsApp a partir dos dígitos do número publicado. */
export function syncWhatsappUrl(): void {
  content.contact.whatsappUrl = `https://wa.me/55${content.contact.whatsapp.replace(/\D/g, '')}`;
}

syncWhatsappUrl();
