import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../api.service';
import type { ApiTicket } from '../models/api.models';
import type { BadgeTone } from '../../ui/data-display/badge/badge';
export type TicketPriority = 'Alta' | 'Media' | 'Baja';
export interface Ticket {
  id: string;
  title: string;
  prio: [TicketPriority, BadgeTone];
  estado: string;
  fecha: string;
  description?: string;
}
const PRIORITY_TONE: Record<TicketPriority, BadgeTone> = {
  Alta: 'danger',
  Media: 'warning',
  Baja: 'neutral',
};
function toTicket(item: ApiTicket): Ticket {
  const priority: TicketPriority =
    item.priority === 'High' ? 'Alta' : item.priority === 'Low' ? 'Baja' : 'Media';
  const estado =
    item.status === 'InReview'
      ? 'En revisión'
      : item.status === 'Closed'
        ? 'Cerrado'
        : item.status === 'Resolved'
          ? 'Resuelto'
          : 'Abierto';
  return {
    id: item.code,
    title: item.title,
    prio: [priority, PRIORITY_TONE[priority]],
    estado,
    fecha: new Date(item.createdAt).toLocaleDateString('es-PE'),
    description: item.description,
  };
}
@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly api = inject(ApiService);
  private readonly _tickets = signal<Ticket[]>([]);
  readonly tickets = this._tickets.asReadonly();
  load(): void {
    this.api.tickets().subscribe((items) => this._tickets.set(items.map(toTicket)));
  }
  addTicket(input: {
    title: string;
    priority: TicketPriority;
    description: string;
  }): Observable<Ticket> {
    const priority =
      input.priority === 'Alta' ? 'High' : input.priority === 'Baja' ? 'Low' : 'Medium';
    return this.api
      .createTicket({ title: input.title, priority, description: input.description })
      .pipe(map(toTicket));
  }
}
