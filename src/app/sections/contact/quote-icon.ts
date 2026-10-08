import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'bolt'
  | 'doc'
  | 'lock'
  | 'chat'
  | 'people'
  | 'rocket'
  | 'chart'
  | 'shield'
  | 'user'
  | 'building'
  | 'mail'
  | 'whatsapp'
  | 'clip'
  | 'upload'
  | 'send'
  | 'check'
  | 'headset';

/**
 * Ícones SVG inline usados apenas na tela de orçamento.
 * Herdam cor via `currentColor` e tamanho via `font-size`/CSS.
 */
@Component({
  selector: 'app-qicon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('bolt') {
          <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l.9-8Z" [attr.stroke-width]="w" />
        }
        @case ('doc') {
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5M8.5 13h7M8.5 17h4" />
        }
        @case ('lock') {
          <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
          <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
        }
        @case ('chat') {
          <path d="M20 12.5a7.5 7.5 0 0 1-10.9 6.7L4.5 20.5l1.4-4.3A7.5 7.5 0 1 1 20 12.5Z" />
        }
        @case ('people') {
          <circle cx="9" cy="8.5" r="3.2" />
          <path d="M3.5 19.5c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
          <path d="M16 6.4a3 3 0 0 1 0 5.9M17.5 15.4c2 .6 3.1 2 3.5 4.1" />
        }
        @case ('rocket') {
          <path d="M14.5 3.5c3.5 0 6 2.5 6 6 0 5-4.5 8.5-8 11l-5-5c2.5-3.5 6-12 7-12Z" />
          <circle cx="14.8" cy="9.2" r="1.8" />
          <path d="M7.5 15.5 4 19l1 1 3.5-3.5" />
        }
        @case ('chart') {
          <path d="M4 20V4" />
          <path d="M4 20h16" />
          <path d="M8.5 16.5v-5M12.5 16.5V7.5M16.5 16.5v-7" />
        }
        @case ('shield') {
          <path d="M12 3.2 5 6v5.5c0 4.4 2.9 7.6 7 9.3 4.1-1.7 7-4.9 7-9.3V6l-7-2.8Z" />
          <path d="M9 12l2.2 2.2L15 10.5" />
        }
        @case ('user') {
          <circle cx="12" cy="8.5" r="3.6" />
          <path d="M5 20c.8-3.5 3.5-5.3 7-5.3s6.2 1.8 7 5.3" />
        }
        @case ('building') {
          <rect x="4" y="4" width="10.5" height="16" rx="1.6" />
          <path d="M14.5 9.5H20V20h-5.5" />
          <path d="M7.5 8h3.5M7.5 12h3.5M7.5 16h3.5" />
        }
        @case ('mail') {
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.4" />
          <path d="M4.5 7.5 12 13l7.5-5.5" />
        }
        @case ('whatsapp') {
          <path d="M20.5 11.8a8.3 8.3 0 0 1-12.2 7.4L4 20.5l1.4-4.2A8.3 8.3 0 1 1 20.5 11.8Z" />
          <path
            d="M9.4 9c.3-.6.8-.5 1.1-.4.3.1.6 1.3.7 1.5.1.2 0 .4-.2.6l-.3.4c-.1.2-.1.3 0 .5.3.6 1.2 1.5 1.9 1.8.2.1.4.1.5-.1l.4-.4c.2-.2.4-.2.6-.1.5.2 1.4.7 1.5.9.1.2 0 .8-.4 1.2-.5.4-1.2.6-2 .4-1.6-.4-3.6-2.2-4.2-3.9-.3-.8-.2-1.7-.1-2.3Z"
          />
        }
        @case ('clip') {
          <path
            d="M18.5 11.5 12 18a4 4 0 0 1-5.7-5.7l6.6-6.6a2.7 2.7 0 0 1 3.8 3.8l-6.6 6.6a1.4 1.4 0 0 1-2-2l6-6"
          />
        }
        @case ('upload') {
          <path d="M12 16V4.5" />
          <path d="M7.5 9 12 4.5 16.5 9" />
          <path d="M4.5 15.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5" />
        }
        @case ('send') {
          <path d="M21 3 10.5 13.5" />
          <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
        }
        @case ('check') {
          <path d="M5 12.5 9.8 17.3 19 7.5" [attr.stroke-width]="3" />
        }
        @case ('headset') {
          <path d="M5 14v-2a7 7 0 0 1 14 0v2" />
          <rect x="3" y="13.5" width="3.5" height="6" rx="1.6" />
          <rect x="17.5" y="13.5" width="3.5" height="6" rx="1.6" />
          <path d="M19 19.5v.5a2.5 2.5 0 0 1-2.5 2.5H13" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    svg {
      width: 1em;
      height: 1em;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class QuoteIcon {
  readonly name = input.required<IconName>();
  protected readonly w = 1.7;
}
