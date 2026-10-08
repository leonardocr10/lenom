import { ChangeDetectionStrategy, Component } from '@angular/core';
import { content } from '../../data/content';
import { RevealDirective } from '../../shared/reveal.directive';
import { SectionEyebrow } from '../../shared/section-eyebrow';

@Component({
  selector: 'app-plans',
  imports: [RevealDirective, SectionEyebrow],
  templateUrl: './plans.html',
  styleUrl: './plans.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans {
  protected readonly plans = content.plans;
  protected readonly guarantees = [
    'Pagamento facilitado',
    'Suporte em todas as etapas',
    'Proposta sem compromisso',
  ];
}
