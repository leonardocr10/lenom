import { ChangeDetectionStrategy, Component } from '@angular/core';
import { content } from '../../data/content';
import { QuoteIcon } from '../../sections/contact/quote-icon';

@Component({
  selector: 'app-whatsapp-fab',
  imports: [QuoteIcon],
  template: `
    <a [href]="url" target="_blank" rel="noopener" aria-label="WhatsApp">
      <app-qicon name="whatsapp" />
      <span class="text">WhatsApp</span>
    </a>
  `,
  styleUrl: './whatsapp-fab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappFab {
  protected readonly url = content.contact.whatsappUrl;
}
