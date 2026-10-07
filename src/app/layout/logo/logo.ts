import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { content } from '../../data/content';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  protected readonly letters = content.logoMeaning;
  protected readonly activeIndex = signal(-1);
  protected readonly label = 'Lenom.AI — ' + content.logoMeaning.map((l) => l.word).join(', ');

  protected activate(i: number): void {
    this.activeIndex.set(i);
  }

  protected reset(): void {
    this.activeIndex.set(-1);
  }
}
