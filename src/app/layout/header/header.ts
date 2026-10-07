import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { content } from '../../data/content';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-header',
  imports: [Logo],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'onScroll()' },
})
export class Header {
  protected readonly nav = content.nav;
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  protected onScroll(): void {
    const scrolled = window.scrollY > 40;
    if (scrolled !== this.scrolled()) this.scrolled.set(scrolled);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
