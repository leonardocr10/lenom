import { ChangeDetectionStrategy, Component } from '@angular/core';
import { content } from '../../data/content';
import { RevealDirective } from '../../shared/reveal.directive';
import { SectionEyebrow } from '../../shared/section-eyebrow';

@Component({
  selector: 'app-testimonials',
  imports: [RevealDirective, SectionEyebrow],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Testimonials {
  protected readonly items = content.testimonials;
}
