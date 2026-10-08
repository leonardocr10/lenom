import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { content } from '../../data/content';
import { RevealDirective } from '../../shared/reveal.directive';
import { SectionEyebrow } from '../../shared/section-eyebrow';
import { QuoteIcon } from '../contact/quote-icon';

@Component({
  selector: 'app-faq',
  imports: [RevealDirective, SectionEyebrow, QuoteIcon],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faq {
  protected readonly items = content.faq;
  protected readonly whatsappUrl = content.contact.whatsappUrl;
  protected readonly openIndex = signal(0);

  protected toggle(i: number): void {
    this.openIndex.update((open) => (open === i ? -1 : i));
  }
}
