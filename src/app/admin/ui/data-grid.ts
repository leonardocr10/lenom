import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface GridColumn {
  key: string;
  label: string;
  /** `text` por padrão; `badge` pinta o valor, `bool` mostra sim/não, `date` formata. */
  type?: 'text' | 'badge' | 'bool' | 'date' | 'number' | 'thumb';
  sortable?: boolean;
  width?: string;
  align?: 'start' | 'end';
}

export interface SortState {
  sort: string;
  dir: 'asc' | 'desc';
}

type Row = Record<string, unknown>;

@Component({
  selector: 'app-data-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.scss',
})
export class DataGrid {
  readonly columns = input.required<GridColumn[]>();
  readonly rows = input.required<Row[]>();
  readonly total = input(0);
  readonly page = input(1);
  readonly perPage = input(10);
  readonly pages = input(1);
  readonly sort = input<SortState>({ sort: 'id', dir: 'asc' });
  readonly loading = input(false);
  readonly emptyText = input('Nenhum registro encontrado.');
  readonly actions = input(true);
  readonly editLabel = input('Editar');

  readonly sortChange = output<SortState>();
  readonly pageChange = output<number>();
  readonly perPageChange = output<number>();
  readonly edit = output<Row>();
  readonly remove = output<Row>();

  readonly perPageOptions = [10, 25, 50, 100];

  readonly range = computed(() => {
    const total = this.total();
    if (!total) return '0 registros';
    const from = (this.page() - 1) * this.perPage() + 1;
    const to = Math.min(total, this.page() * this.perPage());
    return `${from}–${to} de ${total}`;
  });

  /** Janela de no máximo 5 páginas ao redor da atual. */
  readonly pageList = computed(() => {
    const pages = this.pages();
    const current = this.page();
    const start = Math.max(1, Math.min(current - 2, pages - 4));
    const end = Math.min(pages, start + 4);
    const list: number[] = [];
    for (let i = start; i <= end; i++) list.push(i);
    return list;
  });

  toggleSort(column: GridColumn): void {
    if (column.sortable === false) return;
    const state = this.sort();
    const dir = state.sort === column.key && state.dir === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ sort: column.key, dir });
  }

  cell(row: Row, column: GridColumn): string {
    const value = row[column.key];
    if (value === null || value === undefined || value === '') return '—';

    switch (column.type) {
      case 'bool':
        return value ? 'Sim' : 'Não';
      case 'date':
        return new Date(String(value).replace(' ', 'T') + 'Z').toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(Number(value));
      default:
        return String(value);
    }
  }

  badgeTone(row: Row, column: GridColumn): string {
    const value = String(row[column.key] ?? '').toLowerCase();
    if (['novo', 'sim', '1', 'true', 'admin'].includes(value)) return 'green';
    if (['fechado', 'perdido', '0', 'false'].includes(value)) return 'muted';
    return 'navy';
  }

  changePerPage(event: Event): void {
    this.perPageChange.emit(Number((event.target as HTMLSelectElement).value));
  }

  trackRow = (_: number, row: Row) => row['id'] as number;
}
