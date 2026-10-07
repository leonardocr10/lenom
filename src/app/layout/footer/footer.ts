import { ChangeDetectionStrategy, Component } from '@angular/core';
import { content } from '../../data/content';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly contact = content.contact;
  protected readonly year = new Date().getFullYear();
}
