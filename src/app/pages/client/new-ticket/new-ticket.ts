import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from '../../../ui/data-display/card/card';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Select } from '../../../ui/forms/select/select';
import { Textarea } from '../../../ui/forms/textarea/textarea';
import { TicketsService, TicketPriority } from '../../../core/support/tickets.service';

const PRIORITIES: TicketPriority[] = ['Alta', 'Media', 'Baja'];

@Component({
  selector: 'app-new-ticket',
  imports: [FormsModule, Card, Button, Input, Select, Textarea],
  templateUrl: './new-ticket.html',
})
export class NewTicket {
  private readonly ticketsService = inject(TicketsService);
  private readonly router = inject(Router);

  readonly priorities = PRIORITIES;

  readonly title = signal('');
  readonly priority = signal<TicketPriority>('Media');
  readonly description = signal('');

  setPriority(value: string): void {
    this.priority.set(value as TicketPriority);
  }

  onSubmit(): void {
    if (!this.title().trim()) return;
    this.ticketsService
      .addTicket({
        title: this.title(),
        priority: this.priority(),
        description: this.description(),
      })
      .subscribe({ next: () => this.router.navigateByUrl('/panel-cliente') });
  }

  onCancel(): void {
    this.router.navigateByUrl('/panel-cliente');
  }
}
