import { ChangeDetectionStrategy, Component } from '@angular/core';
import { content, Point } from '../../data/content';

/** Centro do motor, nas mesmas coordenadas (%) usadas pelos nós em `content.stage`. */
const CENTER: Point = [50, 46];

@Component({
  selector: 'app-story',
  templateUrl: './story.html',
  styleUrl: './story.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Story {
  protected readonly header = content.storyHeader;
  protected readonly intro = content.storyIntro;
  protected readonly steps = content.storyChapters;
  protected readonly chips = content.storyChapters.flatMap((c) => c.chips ?? []);
  protected readonly nodes = content.stage.nodes;
  protected readonly log = content.stage.log;
  protected readonly center = CENTER;
}
