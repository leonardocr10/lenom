import { HttpClient, HttpParams } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Auth } from './auth';

export interface LeadNotice {
  id: number;
  name: string;
  company: string;
  plan: string;
  status: string;
  created_at: string;
}

interface NoticeResponse {
  unread: number;
  pending: number;
  lastId: number;
  latest: LeadNotice[];
}

const POLL_MS = 30_000;

/**
 * Consulta periodicamente as solicitações novas para o sino do painel.
 * "Lida" é por usuário e por navegador: guarda o último id visto no localStorage.
 */
@Injectable({ providedIn: 'root' })
export class Notifications {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly title = inject(Title);
  private readonly router = inject(Router);

  readonly latest = signal<LeadNotice[]>([]);
  readonly unread = signal(0);
  readonly pending = signal(0);
  readonly lastSeen = signal(0);
  /** Aviso rápido exibido quando chega uma solicitação durante a sessão. */
  readonly toast = signal<LeadNotice | null>(null);

  readonly hasUnread = computed(() => this.unread() > 0);

  private lastId = -1;
  private timer: ReturnType<typeof setInterval> | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private baseTitle = '';

  private get storageKey(): string {
    return `lenom.notifications.seen.${this.auth.user()?.id ?? 0}`;
  }

  /** Inicia o polling; para sozinho quando o componente dono é destruído. */
  start(destroyRef: DestroyRef): void {
    this.lastSeen.set(this.readSeen());
    this.lastId = -1;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), POLL_MS);

    const onFocus = () => this.refresh();
    window.addEventListener('focus', onFocus);

    // A troca de rota redefine o título; reaplica o contador logo depois.
    const nav = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => setTimeout(() => this.setTitleCount(this.unread())));

    destroyRef.onDestroy(() => {
      clearInterval(this.timer);
      clearTimeout(this.toastTimer);
      window.removeEventListener('focus', onFocus);
      nav.unsubscribe();
      this.setTitleCount(0);
    });
  }

  refresh(): void {
    if (!this.auth.isLogged) return;
    const params = new HttpParams().set('after', this.lastSeen());
    this.http.get<NoticeResponse>('/api/admin/notifications', { params }).subscribe({
      next: (data) => {
        // Na primeira consulta só sincroniza; o aviso é para o que chegar depois.
        if (this.lastId >= 0 && data.lastId > this.lastId) {
          const fresh = data.latest.find((n) => n.id > this.lastId);
          if (fresh) this.showToast(fresh);
        }
        this.lastId = data.lastId;
        this.latest.set(data.latest);
        this.unread.set(data.unread);
        this.pending.set(data.pending);
        this.setTitleCount(data.unread);
      },
      error: () => {},
    });
  }

  markAllSeen(): void {
    const id = Math.max(this.lastId, this.lastSeen());
    this.lastSeen.set(id);
    this.unread.set(0);
    this.setTitleCount(0);
    try {
      localStorage.setItem(this.storageKey, String(id));
    } catch {}
  }

  dismissToast(): void {
    clearTimeout(this.toastTimer);
    this.toast.set(null);
  }

  private showToast(notice: LeadNotice): void {
    clearTimeout(this.toastTimer);
    this.toast.set(notice);
    this.toastTimer = setTimeout(() => this.toast.set(null), 8000);
  }

  private setTitleCount(count: number): void {
    const current = this.title.getTitle().replace(/^\(\d+\)\s*/, '');
    this.baseTitle = current || this.baseTitle;
    this.title.setTitle(count > 0 ? `(${count}) ${this.baseTitle}` : this.baseTitle);
  }

  private readSeen(): number {
    try {
      return Number(localStorage.getItem(this.storageKey)) || 0;
    } catch {
      return 0;
    }
  }
}

/** "agora", "há 5 min", "há 3 h", "há 2 dias" — `created_at` vem do SQLite em UTC. */
export function timeAgo(createdAt: string): string {
  const date = new Date(createdAt.replace(' ', 'T') + 'Z');
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'ontem' : `há ${days} dias`;
}
