import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Api, ListQuery } from '../../core/api';
import { DataGrid, GridColumn, SortState } from '../ui/data-grid';

interface MediaRow {
  id: number;
  filename: string;
  original_name: string;
  mime: string;
  size: number;
  created_at: string;
}

@Component({
  selector: 'app-admin-media',
  imports: [DataGrid],
  templateUrl: './media.html',
  styleUrl: './media.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPage {
  private readonly api = inject(Api);

  protected readonly columns: GridColumn[] = [
    { key: 'original_name', label: 'Arquivo' },
    { key: 'mime', label: 'Tipo', type: 'badge', width: '180px' },
    { key: 'sizeLabel', label: 'Tamanho', width: '120px', sortable: false },
    { key: 'created_at', label: 'Enviado em', type: 'date', width: '170px' },
  ];

  protected readonly rows = signal<MediaRow[]>([]);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);
  protected readonly page = signal(1);
  protected readonly perPage = signal(10);
  protected readonly sortState = signal<SortState>({ sort: 'created_at', dir: 'desc' });
  protected readonly search = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly toast = signal('');
  protected readonly uploading = signal(false);
  protected readonly dragging = signal(false);
  protected readonly confirming = signal<MediaRow | null>(null);

  protected readonly view = computed(() =>
    this.rows().map((row) => ({
      ...row,
      sizeLabel: this.humanSize(row.size),
      url: `/uploads/${row.filename}`,
      isImage: row.mime.startsWith('image/'),
    })),
  );

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.load();
  }

  protected load(): void {
    const query: ListQuery = {
      page: this.page(),
      perPage: this.perPage(),
      sort: this.sortState().sort,
      dir: this.sortState().dir,
      search: this.search(),
      filters: {},
    };

    this.loading.set(true);
    this.api.list<MediaRow>('media', query).subscribe({
      next: (result) => {
        this.rows.set(result.rows);
        this.total.set(result.total);
        this.pages.set(result.pages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar a biblioteca.');
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

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.send(file);
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.send(file);
    input.value = '';
  }

  private send(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Arquivo acima de 5 MB.');
      return;
    }

    this.uploading.set(true);
    this.error.set('');
    this.api.upload(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.flash('Arquivo enviado.');
        this.page.set(1);
        this.sortState.set({ sort: 'created_at', dir: 'desc' });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.error.set(err.error?.error || 'Falha no envio.');
      },
    });
  }

  protected copy(url: string): void {
    navigator.clipboard?.writeText(location.origin + url);
    this.flash('Link copiado.');
  }

  protected confirmRemove(): void {
    const row = this.confirming();
    if (!row) return;

    this.api.remove('media', row.id).subscribe({
      next: () => {
        this.confirming.set(null);
        this.flash('Arquivo excluído.');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.confirming.set(null);
        this.error.set(err.error?.error || 'Não foi possível excluir.');
      },
    });
  }

  protected humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }

  private flash(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
