import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { content } from '../../data/content';
import { StoryStage } from './story-stage';

const clamp = (x: number) => Math.min(1, Math.max(0, x));

@Component({
  selector: 'app-story',
  imports: [StoryStage],
  templateUrl: './story.html',
  styleUrl: './story.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Story {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly stage = viewChild.required(StoryStage);

  protected readonly chapters = content.storyChapters;
  protected readonly chapter = signal(0);

  constructor() {
    afterNextRender(() => {
      const update = () => this.update();
      this.zone.runOutsideAngular(() => {
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
      });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      });
      update();
    });
  }

  protected goTo(i: number): void {
    const el = this.section().nativeElement;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY + i * window.innerHeight + 2,
      behavior: 'smooth',
    });
  }

  private update(): void {
    const vh = window.innerHeight;
    const g = (-this.section().nativeElement.getBoundingClientRect().top + vh / 2) / vh;

    this.stage().setProgress({
      a: clamp((g - 0.8) / 0.6),
      f: clamp((g - 1.8) / 0.6),
      d: clamp((g - 2.8) / 0.6),
      s: clamp((g - 3.8) / 0.6),
    });

    const ch = Math.max(0, Math.min(4, Math.floor(g)));
    if (ch !== this.chapter()) this.chapter.set(ch);
  }
}
