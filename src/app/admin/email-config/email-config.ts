import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MailApi, MailConfig, MailLog, MailTemplate, utcDate } from '../../core/mail-api';
import { Micon } from '../ui/micon';

type Tab = 'templates' | 'historico' | 'smtp';

const TEMPLATE_VARS: Record<string, string[]> = {
  'lead-confirmacao': ['nome', 'empresa', 'email', 'telefone', 'plano', 'prazo', 'investimento', 'mensagem'],
  'lead-aviso': ['nome', 'empresa', 'email', 'telefone', 'plano', 'prazo', 'investimento', 'mensagem'],
  'resposta-padrao': ['nome', 'assunto', 'mensagem'],
};

@Component({
  selector: 'app-admin-email-config',
  imports: [Micon],
  templateUrl: './email-config.html',
  styleUrl: './email-config.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailConfigPage {
  private readonly api = inject(MailApi);

  protected readonly tab = signal<Tab>('smtp');
  protected readonly toast = signal('');

  /* SMTP */
  protected readonly config = signal<MailConfig | null>(null);
  protected readonly saving = signal(false);
  protected readonly testing = signal(false);
  protected readonly testResult = signal<{ smtp: string; imap: string } | null>(null);
  protected readonly error = signal('');
  protected readonly testTo = signal('');
  protected readonly sendingTest = signal(false);

  /* Templates */
  protected readonly templates = signal<MailTemplate[]>([]);
  protected readonly editing = signal<MailTemplate | null>(null);
  protected readonly savingTemplate = signal(false);
  protected readonly vars = TEMPLATE_VARS;

  /* Histórico */
  protected readonly logRows = signal<MailLog[]>([]);
  protected readonly logPage = signal(1);
  protected readonly logPages = signal(1);
  protected readonly logTotal = signal(0);
  protected readonly logStatus = signal('');

  constructor() {
    this.api.config().subscribe((c) => this.config.set({ ...c, pass: '' }));
    this.loadTemplates();
    this.loadLog();
  }

  protected setTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'historico') this.loadLog();
  }

  /* ---------- SMTP ---------- */

  protected set<K extends keyof MailConfig>(key: K, value: MailConfig[K]): void {
    this.config.update((c) => (c ? { ...c, [key]: value } : c));
  }

  /** Porta 465 usa SSL direto; 587 usa STARTTLS com a opção desligada. */
  protected setPort(value: string): void {
    const port = Number(value) || 0;
    this.config.update((c) => (c ? { ...c, port, secure: port === 465 ? true : port === 587 ? false : c.secure } : c));
  }

  protected save(): void {
    const c = this.config();
    if (!c) return;
    this.saving.set(true);
    this.error.set('');
    this.api.saveConfig(c).subscribe({
      next: (saved) => {
        this.config.set({ ...saved, pass: '' });
        this.saving.set(false);
        this.flash('Configurações salvas.');
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(message(e));
      },
    });
  }

  protected testConnection(): void {
    this.testing.set(true);
    this.testResult.set(null);
    this.api.testConnection().subscribe({
      next: (r) => {
        this.testing.set(false);
        this.testResult.set(r);
      },
      error: (e: HttpErrorResponse) => {
        this.testing.set(false);
        if (e.error?.smtp !== undefined) this.testResult.set(e.error);
        else this.error.set(message(e));
      },
    });
  }

  protected sendTest(): void {
    this.sendingTest.set(true);
    this.error.set('');
    this.api.testSend(this.testTo().trim()).subscribe({
      next: () => {
        this.sendingTest.set(false);
        this.flash(`E-mail de teste enviado para ${this.testTo()}.`);
        this.loadLog();
      },
      error: (e) => {
        this.sendingTest.set(false);
        this.error.set(message(e));
        this.loadLog();
      },
    });
  }

  /* ---------- Templates ---------- */

  private loadTemplates(): void {
    this.api.templates().subscribe((t) => this.templates.set(t));
  }

  protected edit(t: MailTemplate): void {
    this.editing.set({ ...t });
  }

  protected setTemplate<K extends keyof MailTemplate>(key: K, value: MailTemplate[K]): void {
    this.editing.update((t) => (t ? { ...t, [key]: value } : t));
  }

  protected saveTemplate(): void {
    const t = this.editing();
    if (!t) return;
    this.savingTemplate.set(true);
    this.api.saveTemplate(t).subscribe({
      next: () => {
        this.savingTemplate.set(false);
        this.editing.set(null);
        this.loadTemplates();
        this.flash('Template salvo.');
      },
      error: (e) => {
        this.savingTemplate.set(false);
        this.flash(message(e));
      },
    });
  }

  protected toggleTemplate(t: MailTemplate): void {
    this.api.saveTemplate({ ...t, active: t.active ? 0 : 1 }).subscribe(() => this.loadTemplates());
  }

  /* ---------- Histórico ---------- */

  protected loadLog(): void {
    this.api.log(this.logPage(), this.logStatus()).subscribe((r) => {
      this.logRows.set(r.rows);
      this.logPages.set(r.pages);
      this.logTotal.set(r.total);
    });
  }

  protected setLogStatus(status: string): void {
    this.logStatus.set(status);
    this.logPage.set(1);
    this.loadLog();
  }

  protected goLog(page: number): void {
    if (page < 1 || page > this.logPages()) return;
    this.logPage.set(page);
    this.loadLog();
  }

  protected date(value: string): string {
    return utcDate(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  protected templateName(slug: string): string {
    if (!slug) return 'Mensagem avulsa';
    if (slug === 'teste') return 'Teste de envio';
    if (slug === 'resposta') return 'Resposta';
    return this.templates().find((t) => t.slug === slug)?.name ?? slug;
  }

  private flash(text: string): void {
    this.toast.set(text);
    setTimeout(() => this.toast.set(''), 3500);
  }
}

function message(e: unknown): string {
  return e instanceof HttpErrorResponse ? e.error?.error || 'Falha na comunicação com o servidor.' : String(e);
}
