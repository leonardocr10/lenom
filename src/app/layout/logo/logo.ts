import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { content } from '../../data/content';

/** Tempo com a palavra aberta e pausa entre uma letra e a seguinte. */
const HOLD = 3600;
const GAP = 1400;

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  /** Desliga o ciclo automático onde a logo é só identidade (painel, login). */
  readonly animate = input(true);

  protected readonly letters = content.logoMeaning;
  protected readonly activeIndex = signal(-1);
  protected readonly label = 'Lenom.AI — ' + content.logoMeaning.map((l) => l.word).join(', ');

  /** Palavra mais longa: define a largura reservada para a logo não empurrar o header. */
  protected readonly longestWord = content.logoMeaning
    .map((l) => l.word.slice(1))
    .reduce((a, b) => (b.length > a.length ? b : a), '');

  protected readonly wordmark = content.logoMeaning.map((l) => l.letter).join('') + '.AI';

  /** Enquanto o ponteiro está sobre a logo, o ciclo automático não interfere. */
  private hovering = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private next = 0;

  constructor() {
    const reduced =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduced && this.animate()) {
      this.schedule(GAP);
      inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    }
  }

  protected activate(i: number): void {
    if (!this.animate()) return;
    this.hovering = true;
    clearTimeout(this.timer);
    this.activeIndex.set(i);
  }

  protected reset(): void {
    this.hovering = false;
    this.activeIndex.set(-1);
    this.next = 0;
    this.schedule(GAP);
  }

  private schedule(delay: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), delay);
  }

  private tick(): void {
    if (this.hovering) return;

    // Aba em segundo plano: espera sem avançar o ciclo.
    if (typeof document !== 'undefined' && document.hidden) {
      this.schedule(HOLD);
      return;
    }

    if (this.activeIndex() === -1) {
      this.activeIndex.set(this.next);
      this.next = (this.next + 1) % this.letters.length;
      this.schedule(HOLD);
    } else {
      this.activeIndex.set(-1);
      this.schedule(GAP);
    }
  }
}
