import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './core/auth';

const adminGuard = () => {
  const auth = inject(Auth);
  return auth.isLogged ? true : inject(Router).createUrlTree(['/admin/login']);
};

const adminOnly = () =>
  inject(Auth).user()?.role === 'admin' ? true : inject(Router).createUrlTree(['/admin']);

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
    title: 'Lenom.AI — Sites, sistemas e automação',
  },
  {
    path: 'privacidade',
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
    title: 'Política de Privacidade — Lenom.AI',
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login').then((m) => m.Login),
    title: 'Entrar — Painel Lenom.AI',
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/shell/shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Painel — Lenom.AI',
      },
      {
        path: 'leads',
        loadComponent: () => import('./admin/crud/crud-page').then((m) => m.CrudPage),
        data: { resource: 'leads' },
        title: 'Solicitações — Lenom.AI',
      },
      {
        path: 'emails',
        loadComponent: () => import('./admin/emails/emails').then((m) => m.EmailsPage),
        title: 'E-mails — Lenom.AI',
      },
      {
        path: 'email-config',
        canActivate: [adminOnly],
        loadComponent: () =>
          import('./admin/email-config/email-config').then((m) => m.EmailConfigPage),
        title: 'Configurações de e-mail — Lenom.AI',
      },
      {
        path: 'planos',
        loadComponent: () => import('./admin/crud/crud-page').then((m) => m.CrudPage),
        data: { resource: 'plans' },
        title: 'Planos — Lenom.AI',
      },
      {
        path: 'faq',
        loadComponent: () => import('./admin/crud/crud-page').then((m) => m.CrudPage),
        data: { resource: 'faq' },
        title: 'FAQ — Lenom.AI',
      },
      {
        path: 'portfolio',
        loadComponent: () => import('./admin/crud/crud-page').then((m) => m.CrudPage),
        data: { resource: 'portfolio' },
        title: 'Portfólio — Lenom.AI',
      },
      {
        path: 'depoimentos',
        loadComponent: () => import('./admin/crud/crud-page').then((m) => m.CrudPage),
        data: { resource: 'testimonials' },
        title: 'Depoimentos — Lenom.AI',
      },
      {
        path: 'historia',
        loadComponent: () => import('./admin/crud/crud-page').then((m) => m.CrudPage),
        data: { resource: 'story' },
        title: 'História — Lenom.AI',
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./admin/crud/crud-page').then((m) => m.CrudPage),
        data: { resource: 'users' },
        title: 'Usuários — Lenom.AI',
      },
      {
        path: 'midia',
        loadComponent: () => import('./admin/media/media').then((m) => m.MediaPage),
        title: 'Mídia — Lenom.AI',
      },
      {
        path: 'conteudo',
        loadComponent: () => import('./admin/settings/settings').then((m) => m.SettingsPage),
        title: 'Conteúdo do site — Lenom.AI',
      },
      {
        path: 'perfil',
        loadComponent: () => import('./admin/profile/profile').then((m) => m.ProfilePage),
        title: 'Minha conta — Lenom.AI',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
