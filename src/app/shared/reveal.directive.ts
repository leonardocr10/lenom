import { Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';

const pending = new Set<HTMLElement>();
let observer: IntersectionObserver | null = null;
let globalsReady = false;

function show(el: HTMLElement): void {
  el.style.opacity = '1';
  el.style.transform = 'none';
  observer?.unobserve(el);
  pending.delete(el);
}

function revealAll(): void {
  [...pending].forEach(show);
}

function setupGlobals(): void {
  if (globalsReady) return;
  globalsReady = true;

  observer = new IntersectionObserver(
    (entries) =>
      entries.filter((e) => e.isIntersecting).forEach((e) => show(e.target as HTMLElement)),
    { rootMargin: '0px 0px -8% 0px' },
  );

  // Navegar por âncora não pode deixar seções em branco.
  document.addEventListener(
    'click',
    (e) => {
      if ((e.target as Element | null)?.closest?.('a[href^="#"]')) revealAll();
    },
    true,
  );
  setTimeout(revealAll, 2500);
}

@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    afterNextRender(() => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || this.el.getBoundingClientRect().top < window.innerHeight) return;

      setupGlobals();
      const s = this.el.style;
      s.opacity = '0';
      s.transform = 'translateY(28px)';
      s.transition = 'opacity .9s ease, transform .9s cubic-bezier(.2,.7,.2,1)';
      pending.add(this.el);
      observer?.observe(this.el);
    });
  }

  ngOnDestroy(): void {
    observer?.unobserve(this.el);
    pending.delete(this.el);
  }
}
