import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../core/auth';
import { LeadNotice, Notifications, timeAgo } from '../../core/notifications';
import { Logo } from '../../layout/logo/logo';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly notes = inject(Notifications);
  protected readonly timeAgo = timeAgo;

  protected readonly user = this.auth.user;
  protected readonly menuOpen = signal(false);
  protected readonly bellOpen = signal(false);
  /** Último id visto quando o painel abriu: mantém o destaque dos itens novos enquanto aberto. */
  protected readonly seenBefore = signal(0);

  constructor() {
    this.notes.start(inject(DestroyRef));
  }

  protected readonly groups: { title: string; links: NavLink[] }[] = [
    {
      title: 'Visão geral',
      links: [
        { path: '/admin', label: 'Painel', icon: '◱' },
        { path: '/admin/leads', label: 'Solicitações', icon: '✉' },
        { path: '/admin/emails', label: 'E-mails', icon: '@' },
      ],
    },
    {
      title: 'Conteúdo do site',
      links: [
        { path: '/admin/planos', label: 'Planos e preços', icon: '◈' },
        { path: '/admin/faq', label: 'Perguntas frequentes', icon: '?' },
        { path: '/admin/portfolio', label: 'Portfólio', icon: '▣' },
        { path: '/admin/depoimentos', label: 'Depoimentos', icon: '❝' },
        { path: '/admin/historia', label: 'Capítulos', icon: '⟐' },
        { path: '/admin/conteudo', label: 'Textos e contato', icon: '✎' },
        { path: '/admin/midia', label: 'Mídia', icon: '▤' },
      ],
    },
    {
      title: 'Configurações',
      links: [
        { path: '/admin/usuarios', label: 'Usuários', icon: '☖', adminOnly: true },
        { path: '/admin/email-config', label: 'E-mail (SMTP)', icon: '⚙', adminOnly: true },
        { path: '/admin/perfil', label: 'Minha conta', icon: '☺' },
      ],
    },
  ];

  protected visible(link: NavLink): boolean {
    return !link.adminOnly || this.user()?.role === 'admin';
  }

  protected initials(): string {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  protected toggleBell(): void {
    if (this.bellOpen()) {
      this.bellOpen.set(false);
      return;
    }
    this.seenBefore.set(this.notes.lastSeen());
    this.bellOpen.set(true);
    this.notes.markAllSeen();
    this.notes.refresh();
  }

  protected openLead(notice: LeadNotice): void {
    this.bellOpen.set(false);
    this.notes.dismissToast();
    this.router.navigate(['/admin/leads'], { queryParams: { id: notice.id } });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const bell = this.host.nativeElement.querySelector('.bell-wrap');
    if (this.bellOpen() && bell && !bell.contains(event.target as Node)) this.bellOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.bellOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
