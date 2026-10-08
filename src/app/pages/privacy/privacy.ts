import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { content } from '../../data/content';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Privacy {
  protected readonly contact = content.contact;
  protected readonly updatedAt = '7 de outubro de 2026';
  protected readonly year = new Date().getFullYear();
}
