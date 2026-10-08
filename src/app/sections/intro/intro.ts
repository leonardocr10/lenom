import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Intro {
  protected readonly trust = [
    'Landing pages a partir de R$ 1.290',
    'Integração via API',
    'Suporte contínuo após a entrega',
  ];
}
