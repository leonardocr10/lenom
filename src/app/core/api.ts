import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface ListQuery {
  page: number;
  perPage: number;
  sort: string;
  dir: 'asc' | 'desc';
  search: string;
  filters: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  list<T>(resource: string, query: ListQuery): Observable<Page<T>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('perPage', query.perPage)
      .set('sort', query.sort)
      .set('dir', query.dir);

    if (query.search) params = params.set('search', query.search);
    for (const [key, value] of Object.entries(query.filters)) {
      if (value) params = params.set(`filter_${key}`, value);
    }

    return this.http.get<Page<T>>(`${this.base}/admin/${resource}`, { params });
  }

  get<T>(resource: string, id: number): Observable<T> {
    return this.http.get<T>(`${this.base}/admin/${resource}/${id}`);
  }

  create<T>(resource: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/admin/${resource}`, body);
  }

  update<T>(resource: string, id: number, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/admin/${resource}/${id}`, body);
  }

  remove(resource: string, id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/admin/${resource}/${id}`);
  }

  stats<T>(): Observable<T> {
    return this.http.get<T>(`${this.base}/admin/stats`);
  }

  setting<T>(key: string): Observable<{ key: string; value: T }> {
    return this.http.get<{ key: string; value: T }>(`${this.base}/admin/settings/${key}`);
  }

  saveSetting<T>(key: string, value: T): Observable<{ key: string; value: T }> {
    return this.http.put<{ key: string; value: T }>(`${this.base}/admin/settings/${key}`, {
      value,
    });
  }

  upload(file: File): Observable<{ id: number; filename: string; original_name: string }> {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<{ id: number; filename: string; original_name: string }>(
      `${this.base}/admin/media/upload`,
      data,
    );
  }

  sendLead(data: FormData): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/leads`, data);
  }

  changePassword(current: string, next: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/auth/password`, { current, next });
  }
}
