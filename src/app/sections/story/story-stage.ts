import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { content, Point } from '../../data/content';

export interface StoryProgress {
  a: number;
  f: number;
  d: number;
  s: number;
}

interface StageLine {
  d: string;
  begin: string;
}

const CENTER: Point = [50, 46];
const INPUT_COUNT = 3;

/** Curva Bézier entre um nó e o motor; as saídas partem do centro. */
function linePath([x, y]: Point, input: boolean): string {
  const mx = (x + CENTER[0]) / 2;
  return input
    ? `M${x} ${y} C ${mx} ${y}, ${mx} ${CENTER[1]}, ${CENTER[0]} ${CENTER[1]}`
    : `M${CENTER[0]} ${CENTER[1]} C ${mx} ${CENTER[1]}, ${mx} ${y}, ${x} ${y}`;
}

@Component({
  selector: 'app-story-stage',
  templateUrl: './story-stage.html',
  styleUrl: './story-stage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryStage {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly chapter = input.required<number>();
  readonly chapterSelect = output<number>();

  protected readonly stage = content.stage;
  protected readonly rail = [0, 1, 2, 3, 4];
  protected readonly lines: StageLine[] = content.stage.nodes.map((n, i) => ({
    d: linePath(n.to, i < INPUT_COUNT),
    begin: i < INPUT_COUNT ? '0s' : '-1.2s',
  }));
  protected readonly engineStatus = computed(() =>
    this.chapter() < 2 ? 'Ferramentas conectadas' : 'Executando fluxos',
  );

  /** Escreve direto no DOM: os layers leem estas variáveis via calc(), sem re-render por frame. */
  setProgress(p: StoryProgress): void {
    const style = this.host.style;
    style.setProperty('--a', p.a.toFixed(3));
    style.setProperty('--f', p.f.toFixed(3));
    style.setProperty('--d', p.d.toFixed(3));
    style.setProperty('--s', p.s.toFixed(3));
  }
}
