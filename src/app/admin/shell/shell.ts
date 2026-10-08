import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../core/auth';
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

  protected readonly user = this.auth.user;
  protected readonly menuOpen = signal(false);

  protected readonly groups: { title: string; links: NavLink[] }[] = [
    {
      title: 'Visão geral',
      links: [
        { path: '/admin', label: 'Painel', icon: '◱' },
        { path: '/admin/leads', label: 'Solicitações', icon: '✉' },
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

  protected logout(): void {
    this.auth.logout();
  }
}
