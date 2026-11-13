import { Component } from '@angular/core';

const PHONE = '51993908435';
const MESSAGE = 'Hola Jaytech 👋, vengo desde su web y quisiera más información sobre sus servicios.';

/** Chat link to the Jaytech number with a prefilled message. */
export const WHATSAPP_HREF = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

/** Floating WhatsApp button. Opens a chat to the Jaytech number with a prefilled message. */
@Component({
  selector: 'app-whatsapp-fab',
  templateUrl: './whatsapp-fab.html',
})
export class WhatsAppFab {
  readonly href = WHATSAPP_HREF;
}
