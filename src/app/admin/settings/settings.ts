import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '../../core/api';

interface ContactBlock {
  whatsapp: string;
  email: string;
  city: string;
  cityNote: string;
  hours: string;
}

interface QuoteBlock {
  plans: string[];
  deadlines: string[];
  budgets: string[];
  trust: unknown[];
  steps: unknown[];
  benefits: unknown[];
}

type Tab = 'contato' | 'orcamento' | 'avancado';

const JSON_KEYS = ['nav', 'logoMeaning', 'stage'] as const;

@Component({
  selector: 'app-admin-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly api = inject(Api);

  protected readonly tab = signal<Tab>('contato');
  protected readonly loading = signal(true);
  protected readonly saving = signal('');
  protected readonly error = signal('');
  protected readonly toast = signal('');

  protected readonly contact = signal<ContactBlock>({
    whatsapp: '',
    email: '',
    city: '',
    cityNote: '',
    hours: '',
  });
  protected readonly topics = signal('');
  protected readonly quote = signal<QuoteBlock | null>(null);
  protected readonly quotePlans = signal('');
  protected readonly quoteDeadlines = signal('');
  protected readonly quoteBudgets = signal('');

  /** Blocos estruturados demais para um formulário: editados como JSON. */
  protected readonly advanced = signal<{ key: string; label: string; text: string }[]>([]);

  protected readonly advancedLabels: Record<string, string> = {
    nav: 'Menu de navegação',
    logoMeaning: 'Significado da logo',
    stage: 'Palco animado (cards, KPIs, logs)',
    trust: 'Selos de confiança do formulário',
    steps: 'Etapas "O que acontece depois?"',
    benefits: 'Vantagens "Por que escolher"',
  };

  constructor() {
    this.loadAll();
  }

  private loadAll(): void {
    this.api.setting<ContactBlock>('contact').subscribe({
      next: ({ value }) => {
        this.contact.set(value);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar as configurações.');
        this.loading.set(false);
      },
    });

    this.api.setting<string[]>('contactTopics').subscribe({
      next: ({ value }) => this.topics.set((value ?? []).join('\n')),
    });

    this.api.setting<QuoteBlock>('quote').subscribe({
      next: ({ value }) => {
        this.quote.set(value);
        this.quotePlans.set((value.plans ?? []).join('\n'));
        this.quoteDeadlines.set((value.deadlines ?? []).join('\n'));
        this.quoteBudgets.set((value.budgets ?? []).join('\n'));
        this.pushAdvanced('trust', value.trust);
        this.pushAdvanced('steps', value.steps);
        this.pushAdvanced('benefits', value.benefits);
      },
    });

    for (const key of JSON_KEYS) {
      this.api.setting<unknown>(key).subscribe({
        next: ({ value }) => this.pushAdvanced(key, value),
      });
    }
  }

  private pushAdvanced(key: string, value: unknown): void {
    const entry = {
      key,
      label: this.advancedLabels[key] ?? key,
      text: JSON.stringify(value, null, 2),
    };
    this.advanced.update((list) => [...list.filter((i) => i.key !== key), entry]);
  }

  protected setContact(field: keyof ContactBlock, value: string): void {
    this.contact.update((c) => ({ ...c, [field]: value }));
  }

  protected setAdvanced(key: string, text: string): void {
    this.advanced.update((list) => list.map((i) => (i.key === key ? { ...i, text } : i)));
  }

  protected saveContact(): void {
    this.save('contact', this.contact(), 'Dados de contato salvos.');
  }

  protected saveTopics(): void {
    this.save('contactTopics', this.lines(this.topics()), 'Tipos de projeto salvos.');
  }

  protected saveQuote(): void {
    const current = this.quote();
    if (!current) return;
    this.save(
      'quote',
      {
        ...current,
        plans: this.lines(this.quotePlans()),
        deadlines: this.lines(this.quoteDeadlines()),
        budgets: this.lines(this.quoteBudgets()),
      },
      'Opções do orçamento salvas.',
    );
  }

  protected saveAdvanced(key: string): void {
    const entry = this.advanced().find((i) => i.key === key);
    if (!entry) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(entry.text);
    } catch {
      this.error.set(`JSON inválido em "${entry.label}". Revise antes de salvar.`);
      return;
    }

    // trust/steps/benefits moram dentro do bloco `quote`.
    if (['trust', 'steps', 'benefits'].includes(key)) {
      const current = this.quote();
      if (!current) return;
      this.save('quote', { ...current, [key]: parsed }, `${entry.label} salvo.`);
      this.quote.set({ ...current, [key]: parsed } as QuoteBlock);
      return;
    }

    this.save(key, parsed, `${entry.label} salvo.`);
  }

  private save(key: string, value: unknown, message: string): void {
    this.saving.set(key);
    this.error.set('');
    this.api.saveSetting(key, value).subscribe({
      next: () => {
        this.saving.set('');
        this.toast.set(message);
        setTimeout(() => this.toast.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set('');
        this.error.set(err.error?.error || 'Não foi possível salvar.');
      },
    });
  }

  private lines(text: string): string[] {
    return text
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
  }
}
