import { Injectable, computed, signal } from '@angular/core';
import type { ApiCourse } from '../models/api.models';

/** In-memory cart of courses the visitor is buying ("cotizador"). Not persisted across reloads. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<ApiCourse[]>([]);

  readonly courses = this.items.asReadonly();
  readonly count = computed(() => this.items().length);
  readonly total = computed(() => this.items().reduce((sum, c) => sum + c.price, 0));
  readonly isEmpty = computed(() => this.items().length === 0);

  has(id: string): boolean {
    return this.items().some((c) => c.id === id);
  }

  add(course: ApiCourse): void {
    if (this.has(course.id)) return;
    this.items.update((items) => [...items, course]);
  }

  remove(id: string): void {
    this.items.update((items) => items.filter((c) => c.id !== id));
  }

  toggle(course: ApiCourse): void {
    if (this.has(course.id)) this.remove(course.id);
    else this.add(course);
  }

  clear(): void {
    this.items.set([]);
  }
}
