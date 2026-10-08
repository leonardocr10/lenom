import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Api, ListQuery } from '../../core/api';
import { DataGrid, SortState } from '../ui/data-grid';
import { FormField, RESOURCES, ResourceConfig } from './resource-config';

type Row = Record<string, any>;

@Component({
  selector: 'app-crud-page',
  imports: [FormsModule, DataGrid],
  templateUrl: './crud-page.html',
  styleUrl: './crud-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrudPage {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);

  protected readonly config = signal<ResourceConfig>(this.read());
  protected readonly rows = signal<Row[]>([]);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly toast = signal('');

  protected readonly page = signal(1);
  protected readonly perPage = signal(10);
  protected readonly sortState = signal<SortState>({ sort: 'id', dir: 'asc' });
  protected readonly search = signal('');
  protected readonly filters = signal<Record<string, string>>({});

  protected readonly editing = signal<Row | null>(null);
  protected readonly isNew = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');
  protected readonly confirming = signal<Row | null>(null);
  protected readonly uploadingField = signal('');

  protected readonly hasFilters = computed(
    () => !!this.search() || Object.values(this.filters()).some(Boolean),
  );

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.route.data.subscribe(() => {
      const config = this.read();
      this.config.set(config);
      this.page.set(1);
      this.search.set('');
      this.filters.set({});
      this.sortState.set({ sort: config.defaultSort, dir: config.defaultDir });
      this.load();
    });
  }

  private read(): ResourceConfig {
    const name = this.route.snapshot.data['resource'] as string;
    return RESOURCES[name];
  }

  protected load(): void {
    const query: ListQuery = {
      page: this.page(),
      perPage: this.perPage(),
      sort: this.sortState().sort,
      dir: this.sortState().dir,
      search: this.search(),
      filters: this.filters(),
    };

    this.loading.set(true);
    this.error.set('');
    this.api.list<Row>(this.config().resource, query).subscribe({
      next: (result) => {
        this.rows.set(result.rows);
        this.total.set(result.total);
        this.pages.set(result.pages);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error || 'Não foi possível carregar os dados.');
        this.loading.set(false);
      },
    });
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 350);
  }

  protected onFilter(key: string, value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.page.set(1);
    this.load();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.filters.set({});
    this.page.set(1);
    this.load();
  }

  protected onSort(state: SortState): void {
    this.sortState.set(state);
    this.load();
  }

  protected onPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected onPerPage(perPage: number): void {
    this.perPage.set(perPage);
    this.page.set(1);
    this.load();
  }

  /* ---------------- Formulário ---------------- */

  protected create(): void {
    const blank: Row = {};
    for (const field of this.config().fields) {
      blank[field.key] = field.type === 'bool' ? (field.key === 'published' ? 1 : 0) : '';
    }
    if (blank['position'] !== undefined) blank['position'] = this.total();
    if (blank['role'] !== undefined) blank['role'] = 'editor';
    if (blank['active'] !== undefined) blank['active'] = 1;

    this.isNew.set(true);
    this.formError.set('');
    this.editing.set(blank);
  }

  protected edit(row: Row): void {
    const copy: Row = { ...row };
    for (const field of this.config().fields) {
      if (field.type === 'list') copy[field.key] = (row[field.key] ?? []).join('\n');
      if (field.type === 'password') copy[field.key] = '';
      if (field.type === 'readonly' && Array.isArray(row[field.key])) {
        copy[field.key] = row[field.key].join(', ');
      }
    }
    this.isNew.set(false);
    this.formError.set('');
    this.editing.set(copy);
  }

  protected close(): void {
    this.editing.set(null);
    this.saving.set(false);
  }

  protected value(field: FormField): any {
    return this.editing()?.[field.key] ?? '';
  }

  protected setValue(field: FormField, value: any): void {
    this.editing.update((row) => (row ? { ...row, [field.key]: value } : row));
  }

  protected setBool(field: FormField, event: Event): void {
    this.setValue(field, (event.target as HTMLInputElement).checked ? 1 : 0);
  }

  /* ---------------- Upload de imagem ---------------- */

  protected pickImage(field: FormField, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.formError.set('Selecione um arquivo de imagem.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.formError.set('Imagem acima de 5 MB.');
      return;
    }

    this.uploadingField.set(field.key);
    this.formError.set('');
    this.api.upload(file).subscribe({
      next: (media) => {
        this.setValue(field, `/uploads/${media.filename}`);
        this.uploadingField.set('');
      },
      error: (err: HttpErrorResponse) => {
        this.uploadingField.set('');
        this.formError.set(err.error?.error || 'Falha ao enviar a imagem.');
      },
    });
  }

  protected clearImage(field: FormField): void {
    this.setValue(field, '');
  }

  protected save(): void {
    const row = this.editing();
    if (!row) return;

    const config = this.config();
    const payload: Row = {};
    for (const field of config.fields) {
      if (field.type === 'readonly') continue;
      let value = row[field.key];

      if (field.type === 'list') {
        value = String(value ?? '')
          .split('\n')
          .map((v) => v.trim())
          .filter(Boolean);
      }
      if (field.type === 'number') value = Number(value) || 0;
      if (field.type === 'bool') value = value ? 1 : 0;
      if (field.type === 'password' && !value) continue;

      if (field.required && (value === '' || value === null || value === undefined)) {
        this.formError.set(`Preencha o campo "${field.label}".`);
        return;
      }
      payload[field.key] = value;
    }

    this.saving.set(true);
    this.formError.set('');

    const done = (message: string) => {
      this.saving.set(false);
      this.close();
      this.flash(message);
      this.load();
    };
    const fail = (err: HttpErrorResponse) => {
      this.saving.set(false);
      this.formError.set(err.error?.error || 'Não foi possível salvar.');
    };

    if (this.isNew()) {
      this.api.create(config.resource, payload).subscribe({
        next: () => done(`${this.capital(config.singular)} criado com sucesso.`),
        error: fail,
      });
    } else {
      this.api.update(config.resource, row['id'], payload).subscribe({
        next: () => done('Alterações salvas.'),
        error: fail,
      });
    }
  }

  /* ---------------- Exclusão ---------------- */

  protected askRemove(row: Row): void {
    this.confirming.set(row);
  }

  protected confirmRemove(): void {
    const row = this.confirming();
    if (!row) return;

    this.api.remove(this.config().resource, row['id']).subscribe({
      next: () => {
        this.confirming.set(null);
        this.flash('Registro excluído.');
        if (this.rows().length === 1 && this.page() > 1) this.page.update((p) => p - 1);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.confirming.set(null);
        this.error.set(err.error?.error || 'Não foi possível excluir.');
      },
    });
  }

  protected label(row: Row): string {
    return String(row['name'] ?? row['title'] ?? row['q'] ?? row['company'] ?? `#${row['id']}`);
  }

  private capital(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private flash(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(''), 3200);
  }
}
