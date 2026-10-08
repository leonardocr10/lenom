import { ChangeDetectionStrategy, Component } from '@angular/core';
import { content } from '../../data/content';
import { RevealDirective } from '../../shared/reveal.directive';
import { SectionEyebrow } from '../../shared/section-eyebrow';

@Component({
  selector: 'app-portfolio',
  imports: [RevealDirective, SectionEyebrow],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolio {
  /** O primeiro projeto ocupa o card grande; os demais vão na coluna lateral. */
  protected readonly highlight = content.portfolio[0];
  protected readonly others = content.portfolio.slice(1);
}
