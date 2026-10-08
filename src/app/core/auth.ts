import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

const TOKEN_KEY = 'lenom.token';
const USER_KEY = 'lenom.user';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor';
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<AdminUser | null>(read<AdminUser>(USER_KEY));
  readonly token = signal<string>(localStorage.getItem(TOKEN_KEY) ?? '');

  get isLogged(): boolean {
    return !!this.token();
  }

  login(email: string, password: string): Observable<{ token: string; user: AdminUser }> {
    return this.http
      .post<{ token: string; user: AdminUser }>('/api/auth/login', { email, password })
      .pipe(
        tap(({ token, user }) => {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.token.set(token);
          this.user.set(user);
        }),
      );
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set('');
    this.user.set(null);
    if (redirect) this.router.navigate(['/admin/login']);
  }
}

/** Anexa o token nas chamadas da API e encerra a sessão em 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const request = auth.isLogged
    ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token()}` } })
    : req;

  return new Observable((subscriber) => {
    const sub = next(request).subscribe({
      next: (event) => subscriber.next(event),
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 && auth.isLogged) auth.logout();
        subscriber.error(error);
      },
      complete: () => subscriber.complete(),
    });
    return () => sub.unsubscribe();
  });
};
