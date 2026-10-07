import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { content } from '../../data/content';
import { RevealDirective } from '../../shared/reveal.directive';
import { SectionEyebrow } from '../../shared/section-eyebrow';

@Component({
  selector: 'app-faq',
  imports: [RevealDirective, SectionEyebrow],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faq {
  protected readonly items = content.faq;
  protected readonly openIndex = signal(0);

  protected toggle(i: number): void {
    this.openIndex.update((open) => (open === i ? -1 : i));
  }
}
