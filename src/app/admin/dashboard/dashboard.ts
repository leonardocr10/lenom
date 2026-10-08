import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api';

interface Stats {
  leads: number;
  leadsNew: number;
  leadsWeek: number;
  plans: number;
  faq: number;
  portfolio: number;
  testimonials: number;
  media: number;
  byStatus: { status: string; total: number }[];
  latest: { id: number; name: string; company: string; status: string; created_at: string }[];
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly api = inject(Api);

  protected readonly stats = signal<Stats | null>(null);
  protected readonly error = signal('');

  protected readonly cards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        label: 'Solicitações recebidas',
        value: s.leads,
        note: `${s.leadsWeek} nos últimos 7 dias`,
      },
      { label: 'Aguardando contato', value: s.leadsNew, note: 'status "novo"', accent: true },
      { label: 'Planos publicados', value: s.plans, note: 'visíveis na landing page' },
      { label: 'Perguntas no FAQ', value: s.faq, note: 'visíveis na landing page' },
      { label: 'Projetos no portfólio', value: s.portfolio, note: 'visíveis na landing page' },
      { label: 'Arquivos enviados', value: s.media, note: 'na biblioteca de mídia' },
    ];
  });

  protected readonly maxStatus = computed(() =>
    Math.max(1, ...(this.stats()?.byStatus ?? []).map((s) => s.total)),
  );

  constructor() {
    this.api.stats<Stats>().subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.error.set('Não foi possível carregar os indicadores.'),
    });
  }

  protected when(value: string): string {
    return new Date(value.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
}
