import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from './api';

export type MailView = 'inbox' | 'unread' | 'answered' | 'spam' | 'archive' | 'sent' | 'trash';
export type MailFolder = 'inbox' | 'spam' | 'sent' | 'archive' | 'trash';
export type MailCategory = 'suporte' | 'contato' | 'orcamento';

export interface MailSummary {
  inbox: number;
  unread: number;
  answered: number;
  spam: number;
  sent: number;
  archive: number;
  trash: number;
  spamRemote: number;
  configured: boolean;
  account: string;
  lastSync: string | null;
  lastError: string;
}

export interface MailRow {
  id: number;
  folder: MailFolder;
  from_name: string;
  from_email: string;
  to_email: string;
  subject: string;
  snippet: string;
  category: MailCategory;
  seen: number;
  answered: number;
  has_attachments: number;
  date: string;
}

export interface MailMessage extends MailRow {
  message_id: string;
  text: string;
  html: string;
  attachments: string[];
}

export interface MailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  hasPass?: boolean;
  fromName: string;
  fromEmail: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  notifyTo: string;
}

export interface MailTemplate {
  id: number;
  slug: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  active: number;
  updated_at: string;
}

export interface MailLog {
  id: number;
  to_email: string;
  subject: string;
  template: string;
  status: 'enviado' | 'falhou';
  error: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class MailApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/mail';

  summary(): Observable<MailSummary> {
    return this.http.get<MailSummary>(`${this.base}/summary`);
  }

  list(q: {
    folder: MailView;
    category: string;
    search: string;
    page: number;
    perPage: number;
  }): Observable<Page<MailRow>> {
    let params = new HttpParams()
      .set('folder', q.folder)
      .set('page', q.page)
      .set('perPage', q.perPage);
    if (q.category) params = params.set('category', q.category);
    if (q.search) params = params.set('search', q.search);
    return this.http.get<Page<MailRow>>(`${this.base}/messages`, { params });
  }

  get(id: number): Observable<MailMessage> {
    return this.http.get<MailMessage>(`${this.base}/messages/${id}`);
  }

  patch(
    id: number,
    body: Partial<{ folder: MailFolder; category: MailCategory; seen: boolean }>,
  ): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.base}/messages/${id}`, body);
  }

  remove(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/messages/${id}`);
  }

  reply(id: number, body: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/messages/${id}/reply`, { body });
  }

  send(body: { to: string; subject: string; body: string; template?: string }) {
    return this.http.post<{ ok: boolean }>(`${this.base}/send`, body);
  }

  sync(): Observable<{ added: number }> {
    return this.http.post<{ added: number }>(`${this.base}/sync`, {});
  }

  templates(): Observable<MailTemplate[]> {
    return this.http.get<MailTemplate[]>(`${this.base}/templates`);
  }

  saveTemplate(t: MailTemplate): Observable<MailTemplate> {
    return this.http.put<MailTemplate>(`${this.base}/templates/${t.id}`, t);
  }

  log(page: number, status: string): Observable<Page<MailLog>> {
    let params = new HttpParams().set('page', page);
    if (status) params = params.set('status', status);
    return this.http.get<Page<MailLog>>(`${this.base}/log`, { params });
  }

  config(): Observable<MailConfig> {
    return this.http.get<MailConfig>(`${this.base}/config`);
  }

  saveConfig(c: MailConfig): Observable<MailConfig> {
    return this.http.put<MailConfig>(`${this.base}/config`, c);
  }

  testConnection(): Observable<{ smtp: string; imap: string }> {
    return this.http.post<{ smtp: string; imap: string }>(`${this.base}/test-connection`, {});
  }

  testSend(to: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/test-send`, { to });
  }
}

/** Data do SQLite (UTC) para Date. */
export const utcDate = (s: string) => new Date(s.replace(' ', 'T') + (s.endsWith('Z') ? '' : 'Z'));
