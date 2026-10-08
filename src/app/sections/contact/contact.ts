import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '../../core/api';
import { content } from '../../data/content';
import { RevealDirective } from '../../shared/reveal.directive';
import { SectionEyebrow } from '../../shared/section-eyebrow';
import { IconName, QuoteIcon } from './quote-icon';

const DEFAULT_TOPIC = 'Site';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'zip',
];

type SendStatus = 'idle' | 'loading' | 'sent' | 'error';

/** Formata dígitos como (11) 98765-4321 (celular) ou (11) 8765-4321 (fixo). */
function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = `(${d.slice(0, 2)}) `;
  if (d.length <= 6) return ddd + d.slice(2);
  const split = d.length > 10 ? 7 : 6;
  return `${ddd}${d.slice(2, split)}-${d.slice(split)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RevealDirective, SectionEyebrow, QuoteIcon],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly api = inject(Api);

  protected readonly contact = content.contact;
  protected readonly quote = content.quote;
  protected readonly allTopics = content.contactTopics;
  protected readonly accept = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',');

  protected readonly topics = signal<string[]>([DEFAULT_TOPIC]);
  protected readonly status = signal<SendStatus>('idle');
  protected readonly submitted = signal(false);
  protected readonly dragging = signal(false);
  protected readonly extraOpen = signal(false);
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal('');

  protected readonly sent = computed(() => this.status() === 'sent');
  protected readonly sendError = signal('');
  protected readonly loading = computed(() => this.status() === 'loading');
  protected readonly topicsInvalid = computed(() => this.topics().length === 0 && this.submitted());

  /** Link direto de WhatsApp a partir do número publicado em content. */
  protected readonly whatsappUrl = `https://wa.me/55${this.contact.whatsapp.replace(/\D/g, '')}`;

  /** Canais de atendimento mantidos na sidebar em formato compacto. */
  protected readonly info: { icon: IconName; text: string }[] = [
    { icon: 'whatsapp', text: this.contact.whatsapp },
    { icon: 'mail', text: this.contact.email },
    { icon: 'building', text: `${this.contact.city} — ${this.contact.cityNote}` },
    { icon: 'bolt', text: this.contact.hours },
  ];

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
    plan: [this.quote.plans[0]],
    message: ['', [Validators.required, Validators.minLength(10)]],
    deadline: [''],
    budget: [''],
    privacy: [false, Validators.requiredTrue],
  });

  protected toggleExtra(): void {
    this.extraOpen.update((open) => !open);
  }

  protected toggleTopic(topic: string): void {
    this.topics.update((list) =>
      list.includes(topic) ? list.filter((t) => t !== topic) : [...list, topic],
    );
  }

  protected pick(field: 'deadline' | 'budget', value: string): void {
    const control = this.form.controls[field];
    control.setValue(control.value === value ? '' : value);
    control.markAsTouched();
  }

  protected onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = maskPhone(input.value);
    input.value = masked;
    this.form.controls.phone.setValue(masked);
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected fileLabel(): string {
    const f = this.file();
    return f ? `${f.name} · ${formatBytes(f.size)}` : '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) this.acceptFile(dropped);
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    if (picked) this.acceptFile(picked);
    input.value = '';
  }

  protected clearFile(): void {
    this.file.set(null);
    this.fileError.set('');
  }

  private acceptFile(candidate: File): void {
    const ext = candidate.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      this.file.set(null);
      this.fileError.set('Formato não suportado. Use PDF, DOC, XLS, imagem ou ZIP.');
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      this.file.set(null);
      this.fileError.set('Arquivo acima de 5 MB.');
      return;
    }
    this.fileError.set('');
    this.file.set(candidate);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.topics().length === 0) {
      this.form.markAllAsTouched();
      this.status.set('idle');
      queueMicrotask(() => this.focusFirstInvalid());
      return;
    }

    this.status.set('loading');
    this.sendError.set('');

    const value = this.form.getRawValue();
    const data = new FormData();
    data.append('name', value.name);
    data.append('company', value.company);
    data.append('email', value.email);
    data.append('phone', value.phone);
    data.append('plan', value.plan);
    data.append('message', value.message);
    data.append('deadline', value.deadline);
    data.append('budget', value.budget);
    data.append('topics', JSON.stringify(this.topics()));
    const attachment = this.file();
    if (attachment) data.append('file', attachment);

    this.api.sendLead(data).subscribe({
      next: () => this.status.set('sent'),
      error: (err: HttpErrorResponse) => {
        this.status.set('error');
        this.sendError.set(
          err.error?.error ||
            'Não foi possível enviar agora. Tente novamente ou chame no WhatsApp.',
        );
      },
    });
  }

  /** Rola e foca o primeiro campo inválido, incluindo os grupos de chips. */
  private focusFirstInvalid(): void {
    const order: (keyof typeof this.form.controls | 'topics')[] = [
      'name',
      'email',
      'phone',
      'topics',
      'message',
      'privacy',
    ];
    const first = order.find((key) =>
      key === 'topics' ? this.topics().length === 0 : this.form.controls[key].invalid,
    );
    if (!first) return;
    const target = this.host.nativeElement.querySelector<HTMLElement>(`[data-field="${first}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target?.focus({ preventScroll: true });
  }

  protected reset(): void {
    this.form.reset({ plan: this.quote.plans[0] });
    this.topics.set([DEFAULT_TOPIC]);
    this.submitted.set(false);
    this.status.set('idle');
    this.clearFile();
  }
}
