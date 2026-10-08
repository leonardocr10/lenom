import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Footer } from '../../layout/footer/footer';
import { Header } from '../../layout/header/header';
import { WhatsappFab } from '../../layout/whatsapp-fab/whatsapp-fab';
import { Contact } from '../../sections/contact/contact';
import { Faq } from '../../sections/faq/faq';
import { Intro } from '../../sections/intro/intro';
import { Plans } from '../../sections/plans/plans';
import { Portfolio } from '../../sections/portfolio/portfolio';
import { Story } from '../../sections/story/story';
import { Testimonials } from '../../sections/testimonials/testimonials';

@Component({
  selector: 'app-landing',
  imports: [
    Header,
    Intro,
    Story,
    Portfolio,
    Plans,
    Testimonials,
    Faq,
    Contact,
    Footer,
    WhatsappFab,
  ],
  template: `
    <app-header />
    <main>
      <app-intro />
      <app-story />
      <app-portfolio />
      <app-plans />
      <app-testimonials />
      <app-faq />
      <app-contact />
    </main>
    <app-footer />
    <app-whatsapp-fab />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {}
