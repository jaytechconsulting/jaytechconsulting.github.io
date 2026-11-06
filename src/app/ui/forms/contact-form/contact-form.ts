import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Input } from '../input/input';
import { Textarea } from '../textarea/textarea';
import { Select } from '../select/select';
import { Button } from '../../actions/button/button';

export interface ContactFormValue {
  name: string;
  email: string;
  service: string;
  message: string;
}

const SERVICES = ['Aplicación web', 'Página / landing', 'Automatización', 'Integración / API', 'No estoy seguro'];

/** Composed lead-capture form used across marketing surfaces. */
@Component({
  selector: 'app-contact-form',
  imports: [FormsModule, Input, Textarea, Select, Button],
  templateUrl: './contact-form.html',
})
export class ContactForm {
  readonly title = input('¿Hablamos de tu proyecto?');
  readonly subtitle = input('Cuéntanos qué necesitas y te respondemos en menos de 24 horas.');
  readonly submitted = output<ContactFormValue>();

  readonly services = SERVICES;

  readonly name = signal('');
  readonly email = signal('');
  readonly service = signal('');
  readonly message = signal('');


  onSubmit(): void {
    this.submitted.emit({
      name: this.name(),
      email: this.email(),
      service: this.service(),
      message: this.message(),
    });
  }
}
