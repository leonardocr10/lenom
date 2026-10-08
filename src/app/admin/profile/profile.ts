import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '../../core/api';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  protected readonly user = this.auth.user;
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly done = signal(false);

  protected readonly form = this.fb.group({
    current: ['', Validators.required],
    next: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', Validators.required],
  });

  protected submit(): void {
    this.error.set('');
    this.done.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Preencha todos os campos. A nova senha precisa de 6+ caracteres.');
      return;
    }

    const { current, next, confirm } = this.form.getRawValue();
    if (next !== confirm) {
      this.error.set('A confirmação não bate com a nova senha.');
      return;
    }

    this.saving.set(true);
    this.api.changePassword(current, next).subscribe({
      next: () => {
        this.saving.set(false);
        this.done.set(true);
        this.form.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.error || 'Não foi possível trocar a senha.');
      },
    });
  }

  protected logout(): void {
    this.auth.logout();
  }
}
