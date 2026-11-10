import { AccessService } from '../../../core/access/access.service';
import { Avatar } from '../../data-display/avatar/avatar';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Icon } from '../../data-display/icon/icon';
let nextId = 0;
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, Icon, Avatar],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  readonly access = inject(AccessService);
  readonly roleLabel = computed(
    () =>
      this.access
        .session()
        .roles.map((role) => role.name)
        .join(', ') ||
      (this.auth.currentUser()?.role === 'admin' ? 'Sin roles asignados' : 'Cliente'),
  );
  readonly auth = inject(AuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly open = signal(false);
  readonly logout = output<void>();
  readonly menuId = `account-menu-${++nextId}`;
  toggle(): void {
    this.open.update((value) => !value);
  }
  close(restore = false): void {
    this.open.set(false);
    if (restore)
      this.host.nativeElement.querySelector<HTMLButtonElement>('.account-trigger')?.focus();
  }
  signOut(): void {
    this.close(true);
    this.logout.emit();
  }
  triggerKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open.set(true);
      requestAnimationFrame(() => {
        const items = this.items();
        (event.key === 'ArrowUp' ? items[items.length - 1] : items[0])?.focus();
      });
    }
  }
  menuKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }
    if (event.key === 'Tab') {
      this.close(true);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const items = this.items();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }
  private items(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role=menuitem]'));
  }
  @HostListener('document:pointerdown', ['$event']) outside(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }
  @HostListener('document:keydown.escape') escape(): void {
    if (this.open()) this.close(true);
  }
}
