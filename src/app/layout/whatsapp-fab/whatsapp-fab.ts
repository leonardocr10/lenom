import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-fab',
  template: `<a href="#contato"><span class="dot"></span>WhatsApp</a>`,
  styleUrl: './whatsapp-fab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappFab {}
