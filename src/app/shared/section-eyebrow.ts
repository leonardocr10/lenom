import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-eyebrow',
  template: `<span class="mark"><i></i><i></i></span><ng-content />`,
  styleUrl: './section-eyebrow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionEyebrow {}
