export type Point = [x: number, y: number];

export interface PortfolioItem {
  tag: string;
  title: string;
  desc: string;
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

export interface Content {
  portfolio: PortfolioItem[];
  plans: Plan[];
  testimonials: Testimonial[];
  faq: FaqItem[];
  contactTopics: string[];
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
  };
}

export const content: Content = {
  portfolio: [
    {
      tag: 'E-COMMERCE + ERP',
      title: 'Cassiano3D',
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
      cta: 'Conhecer soluções SaaS',
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
  contactTopics: ['Site', 'Landing Page', 'Sistema', 'E-commerce', 'Automação'],
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
      label: 'Soluções',
      href: '#historia',
    },
    {
      label: 'Planos e preços',
      href: '#planos',
    },
    {
      label: 'Portfólio',
      href: '#portfolio',
    },
    {
      label: 'Como funciona',
      href: '#historia',
    },
    {
      label: 'Contato',
      href: '#contato',
    },
  ],
  storyChapters: [
    {
      n: '01',
      eyebrow: '01 — O CENÁRIO',
      title: 'Ferramentas soltas.',
      titleAccent: 'Trabalho repetido.',
      text: 'Leads no formulário, pedidos no WhatsApp, números na planilha. Sua equipe passa o dia copiando informações de um lugar para outro.',
    },
    {
      n: '02',
      eyebrow: '02 — CONECTAMOS',
      title: 'Tudo passa a',
      titleAccent: 'conversar.',
      text: 'Integramos site, WhatsApp, e-mail, CRM e planilhas a um único motor de automação, com integrações via API.',
      chips: ['Integração via API', 'Dados centralizados', 'Sem retrabalho'],
    },
    {
      n: '03',
      eyebrow: '03 — AUTOMATIZAMOS',
      title: 'As tarefas acontecem',
      titleAccent: 'sozinhas.',
      text: 'Cada evento dispara um fluxo: o lead vira contato no CRM, o pedido é confirmado na hora e o relatório chega pronto na segunda de manhã.',
    },
    {
      n: '04',
      eyebrow: '04 — VOCÊ ACOMPANHA',
      title: 'Visão clara do que',
      titleAccent: 'está funcionando.',
      text: 'Painéis e relatórios gerenciais mostram o impacto em tempo real, com perfis de acesso para cada equipe.',
    },
    {
      n: '05',
      eyebrow: '05 — CRESCEMOS JUNTOS',
      title: 'Da automação ao',
      titleAccent: 'sistema completo.',
      text: 'Sites, landing pages, e-commerce e sistemas sob medida — com suporte contínuo depois da entrega.',
      ctas: [
        {
          label: 'Ver planos e preços →',
          href: '#planos',
          variant: 'primary',
        },
        {
          label: 'Ver portfólio',
          href: '#portfolio',
          variant: 'secondary',
        },
      ],
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
  },
};
