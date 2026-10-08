import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';
import {
  MailApi,
  MailCategory,
  MailFolder,
  MailMessage,
  MailRow,
  MailSummary,
  MailTemplate,
  MailView,
  utcDate,
} from '../../core/mail-api';
import { timeAgo } from '../../core/notifications';
import { Micon, MiconName } from '../ui/micon';

interface FolderItem {
  view: MailView;
  label: string;
  icon: MiconName;
  count: (s: MailSummary) => number;
}

const CATEGORY_LABEL: Record<MailCategory, string> = {
  suporte: 'Suporte',
  contato: 'Contato',
  orcamento: 'Orçamento',
};

@Component({
  selector: 'app-admin-emails',
  imports: [Micon, RouterLink],
  templateUrl: './emails.html',
  styleUrl: './emails.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailsPage {
  private readonly api = inject(MailApi);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly auth = inject(Auth);
  protected readonly isAdmin = computed(() => this.auth.user()?.role === 'admin');

  protected readonly folders: FolderItem[] = [
    { view: 'inbox', label: 'Caixa de entrada', icon: 'inbox', count: (s) => s.inbox },
    { view: 'unread', label: 'Não lidos', icon: 'mail', count: (s) => s.unread },
    { view: 'answered', label: 'Respondidos', icon: 'reply', count: (s) => s.answered },
    { view: 'spam', label: 'Spam', icon: 'shield', count: (s) => s.spam },
    { view: 'archive', label: 'Arquivados', icon: 'archive', count: (s) => s.archive },
    { view: 'sent', label: 'Enviados', icon: 'send', count: (s) => s.sent },
    { view: 'trash', label: 'Lixeira', icon: 'trash', count: (s) => s.trash },
  ];
  protected readonly categories: { key: '' | MailCategory; label: string }[] = [
    { key: '', label: 'Todos' },
    { key: 'suporte', label: 'Suporte' },
    { key: 'contato', label: 'Contato' },
    { key: 'orcamento', label: 'Orçamentos' },
  ];
  protected readonly categoryLabel = CATEGORY_LABEL;

  protected readonly summary = signal<MailSummary | null>(null);
  protected readonly view = signal<MailView>('inbox');
  protected readonly category = signal<'' | MailCategory>('');
  protected readonly search = signal('');
  protected readonly perPage = signal(25);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly total = signal(0);
  protected readonly rows = signal<MailRow[]>([]);
  protected readonly loading = signal(false);
  protected readonly syncing = signal(false);

  protected readonly selected = signal<MailMessage | null>(null);
  protected readonly opening = signal(false);
  protected readonly replyText = signal('');
  protected readonly replying = signal(false);

  protected readonly composeOpen = signal(false);
  protected readonly compose = signal({ to: '', subject: '', body: '', template: '' });
  protected readonly composeError = signal('');
  protected readonly sending = signal(false);
  protected readonly templates = signal<MailTemplate[]>([]);

  protected readonly toast = signal('');
  protected readonly error = signal('');

  protected readonly viewLabel = computed(
    () => this.folders.find((f) => f.view === this.view())?.label ?? '',
  );

  /** HTML do e-mail num iframe isolado (sandbox sem scripts); links abrem em nova aba. */
  protected readonly frameDoc = computed<SafeHtml | null>(() => {
    const m = this.selected();
    if (!m) return null;
    const body = m.html || `<pre style="white-space:pre-wrap;font:14px/1.6 Arial,sans-serif;margin:0">${escapeHtml(m.text)}</pre>`;
    const doc = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;padding:4px;font:14px/1.6 Arial,sans-serif;color:#1b2b3a;word-wrap:break-word}img{max-width:100%;height:auto}</style></head><body>${body}</body></html>`;
    return this.sanitizer.bypassSecurityTrustHtml(doc);
  });

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.loadSummary();
    this.load();
    this.api.templates().subscribe((t) => this.templates.set(t));
  }

  protected loadSummary(): void {
    this.api.summary().subscribe((s) => this.summary.set(s));
  }

  protected load(): void {
    this.loading.set(true);
    this.api
      .list({
        folder: this.view(),
        category: this.category(),
        search: this.search(),
        page: this.page(),
        perPage: this.perPage(),
      })
      .subscribe({
        next: (r) => {
          this.rows.set(r.rows);
          this.total.set(r.total);
          this.pages.set(r.pages);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.error.set(message(e));
        },
      });
  }

  protected setView(view: MailView): void {
    this.view.set(view);
    this.page.set(1);
    this.selected.set(null);
    this.load();
  }

  protected setCategory(category: '' | MailCategory): void {
    this.category.set(category);
    this.page.set(1);
    this.load();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 300);
  }

  protected setPerPage(value: string): void {
    this.perPage.set(Number(value));
    this.page.set(1);
    this.load();
  }

  protected go(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  protected sync(): void {
    this.syncing.set(true);
    this.api.sync().subscribe({
      next: (r) => {
        this.syncing.set(false);
        this.flash(r.added ? `${r.added} mensagem(ns) nova(s).` : 'Caixa já está atualizada.');
        this.loadSummary();
        this.load();
      },
      error: (e) => {
        this.syncing.set(false);
        this.flash(message(e));
        this.loadSummary();
      },
    });
  }

  protected open(row: MailRow): void {
    this.opening.set(true);
    this.replyText.set('');
    this.api.get(row.id).subscribe({
      next: (m) => {
        this.selected.set(m);
        this.opening.set(false);
        if (!row.seen) {
          this.rows.update((list) => list.map((r) => (r.id === row.id ? { ...r, seen: 1 } : r)));
          this.loadSummary();
        }
      },
      error: (e) => {
        this.opening.set(false);
        this.flash(message(e));
      },
    });
  }

  protected move(folder: MailFolder): void {
    const m = this.selected();
    if (!m) return;
    this.api.patch(m.id, { folder }).subscribe(() => {
      const labels: Record<MailFolder, string> = {
        inbox: 'Movido para a caixa de entrada.',
        archive: 'Arquivado.',
        spam: 'Marcado como spam.',
        trash: 'Movido para a lixeira.',
        sent: '',
      };
      this.flash(labels[folder]);
      this.selected.set(null);
      this.loadSummary();
      this.load();
    });
  }

  protected deleteForever(): void {
    const m = this.selected();
    if (!m || !confirm('Excluir esta mensagem do painel de vez?')) return;
    this.api.remove(m.id).subscribe(() => {
      this.flash('Mensagem excluída.');
      this.selected.set(null);
      this.loadSummary();
      this.load();
    });
  }

  protected markUnread(): void {
    const m = this.selected();
    if (!m) return;
    this.api.patch(m.id, { seen: false }).subscribe(() => {
      this.rows.update((list) => list.map((r) => (r.id === m.id ? { ...r, seen: 0 } : r)));
      this.selected.set(null);
      this.loadSummary();
    });
  }

  protected setMessageCategory(category: MailCategory): void {
    const m = this.selected();
    if (!m) return;
    this.api.patch(m.id, { category }).subscribe(() => {
      this.selected.set({ ...m, category });
      this.rows.update((list) => list.map((r) => (r.id === m.id ? { ...r, category } : r)));
    });
  }

  protected sendReply(): void {
    const m = this.selected();
    const text = this.replyText().trim();
    if (!m || !text) return;
    this.replying.set(true);
    this.api.reply(m.id, text).subscribe({
      next: () => {
        this.replying.set(false);
        this.replyText.set('');
        this.selected.set({ ...m, answered: 1 });
        this.rows.update((list) => list.map((r) => (r.id === m.id ? { ...r, answered: 1 } : r)));
        this.flash('Resposta enviada.');
        this.loadSummary();
      },
      error: (e) => {
        this.replying.set(false);
        this.flash(message(e));
      },
    });
  }

  protected openCompose(): void {
    this.compose.set({ to: '', subject: '', body: '', template: '' });
    this.composeError.set('');
    this.composeOpen.set(true);
  }

  protected setCompose(key: 'to' | 'subject' | 'body', value: string): void {
    this.compose.update((c) => ({ ...c, [key]: value }));
  }

  /** Preenche assunto e corpo com o template; variáveis sem valor ficam para editar. */
  protected applyTemplate(slug: string): void {
    const t = this.templates().find((x) => x.slug === slug);
    this.compose.update((c) =>
      t
        ? {
            ...c,
            template: slug,
            subject: t.subject.replace(/\{\{\s*assunto\s*\}\}/g, '').replace(/[—\s-]+$/, ''),
            body: t.body.replace(/\{\{\s*mensagem\s*\}\}/g, ''),
          }
        : { ...c, template: '' },
    );
  }

  protected sendCompose(): void {
    const c = this.compose();
    this.sending.set(true);
    this.composeError.set('');
    this.api.send(c).subscribe({
      next: () => {
        this.sending.set(false);
        this.composeOpen.set(false);
        this.flash('Mensagem enviada.');
        this.loadSummary();
        if (this.view() === 'sent') this.load();
      },
      error: (e) => {
        this.sending.set(false);
        this.composeError.set(message(e));
      },
    });
  }

  protected initials(row: { from_name: string; from_email: string; to_email: string; folder: string }): string {
    const source = row.folder === 'sent' ? row.to_email : row.from_name || row.from_email;
    const words = source.replace(/[<>"]/g, '').split(/[\s@._-]+/).filter(Boolean);
    return ((words[0]?.[0] ?? '?') + (words[1]?.[0] ?? '')).toUpperCase();
  }

  protected shortDate(date: string): string {
    const d = utcDate(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  protected fullDate(date: string): string {
    return utcDate(date).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  protected lastSync(s: MailSummary): string {
    return s.lastSync ? `Última sincronização ${timeAgo(s.lastSync.replace('T', ' ').slice(0, 19))}` : 'Ainda não sincronizado';
  }

  private flash(text: string): void {
    this.toast.set(text);
    setTimeout(() => this.toast.set(''), 3500);
  }
}

function message(e: unknown): string {
  return e instanceof HttpErrorResponse ? e.error?.error || 'Falha na comunicação com o servidor.' : String(e);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}
