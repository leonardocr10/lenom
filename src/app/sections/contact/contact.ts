import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { content } from '../../data/content';
import { RevealDirective } from '../../shared/reveal.directive';
import { SectionEyebrow } from '../../shared/section-eyebrow';

const DEFAULT_TOPIC = 'Automação';

/** Formata dígitos como (11) 98765-4321 (celular) ou (11) 8765-4321 (fixo). */
function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = `(${d.slice(0, 2)}) `;
  if (d.length <= 6) return ddd + d.slice(2);
  const split = d.length > 10 ? 7 : 6;
  return `${ddd}${d.slice(2, split)}-${d.slice(split)}`;
}

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RevealDirective, SectionEyebrow],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly contact = content.contact;
  protected readonly allTopics = content.contactTopics;
  protected readonly topics = signal<string[]>([DEFAULT_TOPIC]);
  protected readonly sent = signal(false);
  protected readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
    email: ['', Validators.email],
    privacy: [false, Validators.requiredTrue],
  });

  protected readonly cards = [
    { icon: 'WA', title: 'WhatsApp', text: this.contact.whatsapp },
    { icon: '@', title: 'E-mail', text: this.contact.email },
    { icon: 'SP', title: this.contact.city, text: this.contact.cityNote },
    { icon: '9h', title: 'Horário de atendimento', text: this.contact.hours },
  ];

  protected toggleTopic(topic: string): void {
    this.topics.update((list) =>
      list.includes(topic) ? list.filter((t) => t !== topic) : [...list, topic],
    );
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

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Integração de envio (endpoint/serviço) ainda a definir; payload = { ...form.getRawValue(), topics }.
    this.sent.set(true);
  }

  protected reset(): void {
    this.form.reset();
    this.topics.set([DEFAULT_TOPIC]);
    this.submitted.set(false);
    this.sent.set(false);
  }
}
