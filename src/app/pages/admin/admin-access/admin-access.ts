import { IconPicker } from '../../../ui/forms/icon-picker/icon-picker';
import { Component, computed, inject, signal, HostListener, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Subject, switchMap, timer, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api.models';
import { AccessMenu, AccessPermission, AccessService } from '../../../core/access/access.service';
import { AdminShell } from '../admin-shell/admin-shell';
import { Input } from '../../../ui/forms/input/input';
import { Textarea } from '../../../ui/forms/textarea/textarea';
import { Select } from '../../../ui/forms/select/select';
import { Checkbox } from '../../../ui/forms/checkbox/checkbox';
import { NumberInput } from '../../../ui/forms/number-input/number-input';
import { Button } from '../../../ui/actions/button/button';
import { ModuleActions } from '../../../ui/actions/module-actions/module-actions';
import { Icon, ICON_PATHS } from '../../../ui/data-display/icon/icon';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  permissionIds: string[];
}
interface AccessState {
  roles: Role[];
  permissions: AccessPermission[];
  menus: AccessMenu[];
  icons?: string[];
}
interface UserRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roles: string[];
}
interface AuditEntry {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  target: string;
  createdAt: string;
}
interface UserAccess {
  user: UserRow;
  roleIds: string[];
  overrides: { permissionId: string; isAllowed: boolean }[];
  effective: string[];
}
interface Draft {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  resource: string;
  action: string;
  label: string;
  route: string;
  section: string;
  icon: string;
  parentId: string;
  permissionId: string;
  sortOrder: number;
}
const blank = (): Draft => ({
  code: '',
  name: '',
  description: '',
  isActive: true,
  resource: '',
  action: '',
  label: '',
  route: '',
  section: '',
  icon: 'shield',
  parentId: '',
  permissionId: '',
  sortOrder: 0,
});
@Component({
  selector: 'app-admin-access',
  imports: [
    AdminShell,
    Input,
    Textarea,
    Select,
    Checkbox,
    NumberInput,
    Button,
    ModuleActions,
    Icon,
    DatePipe,
    IconPicker,
  ],
  templateUrl: './admin-access.html',
  styleUrl: './admin-access.css',
})
export class AdminAccess {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly access = inject(AccessService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  readonly view = signal('roles');
  readonly busy = signal(false);
  readonly failed = signal(false);
  readonly state = signal<AccessState>({ roles: [], permissions: [], menus: [] });
  readonly query = signal('');
  readonly permissionQuery = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly editing = signal(false);
  readonly readOnly = signal(true);
  readonly draft = signal<Draft>(blank());
  readonly grantIds = signal<Set<string>>(new Set());
  readonly chosenRoles = signal<Set<string>>(new Set());
  readonly overrides = signal<Record<string, 'allow' | 'deny'>>({});
  readonly userDetails = signal<UserAccess | null>(null);
  readonly users = signal<{ items: UserRow[]; total: number; page: number; pageSize: number }>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 15,
  });
  readonly audit = signal<AuditEntry[]>([]);
  readonly page = signal(1);
  private readonly typing = new Subject<string>();
  readonly isUser = computed(() => this.view() === 'usuarios');
  readonly isAudit = computed(() => this.view() === 'auditoria');
  readonly endpoint = computed(
    () => ({ roles: 'roles', permisos: 'permissions', menus: 'menus' })[this.view()] ?? 'users',
  );
  readonly title = computed(() => this.access.currentMenu()?.label ?? 'Seguridad y accesos');
  readonly records = computed(() => {
    const source =
      this.view() === 'roles'
        ? this.state().roles.map((x) => ({
            id: x.id,
            title: x.name,
            detail: x.code,
            active: x.isActive,
            system: x.isSystem,
          }))
        : this.view() === 'permisos'
          ? this.state().permissions.map((x) => ({
              id: x.id,
              title: x.name,
              detail: x.code,
              active: x.isActive !== false,
              system: !!x.isSystem,
            }))
          : this.state().menus.map((x) => ({
              id: x.id,
              title: x.label,
              detail: x.route || 'Grupo de menus',
              active: x.isActive,
              system: x.code.startsWith('access'),
            }));
    const q = this.query().trim().toLowerCase();
    return source.filter((x) => (x.title + ' ' + x.detail).toLowerCase().includes(q));
  });
  readonly pagedRecords = computed(() =>
    this.records().slice((this.page() - 1) * 15, this.page() * 15),
  );
  readonly total = computed(() => (this.isUser() ? this.users().total : this.records().length));
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / 15)));
  readonly selectedName = computed(() =>
    this.isUser()
      ? (this.userDetails()?.user.name ?? '')
      : (this.records().find((x) => x.id === this.selectedId())?.title ?? ''),
  );
  readonly protectedMenu = computed(
    () =>
      this.view() === 'menus' &&
      !!this.state()
        .menus.find((m) => m.id === this.selectedId())
        ?.code.startsWith('access'),
  );
  readonly systemPermission = computed(
    () =>
      this.view() === 'permisos' &&
      !!this.state().permissions.find((p) => p.id === this.selectedId())?.isSystem,
  );
  readonly protectedRemoval = computed(
    () => this.selectedSystem() || this.protectedMenu() || this.systemPermission(),
  );
  readonly selectedSystem = computed(
    () =>
      this.view() === 'roles' &&
      !!this.state().roles.find((x) => x.id === this.selectedId())?.isSystem,
  );
  readonly permissionGroups = computed(() => {
    const q = this.permissionQuery().trim().toLowerCase();
    const source = this.state().permissions.filter((p) =>
      (p.name + ' ' + p.code).toLowerCase().includes(q),
    );
    return [...new Set(source.map((p) => p.resource))].map((resource) => ({
      resource,
      items: source.filter((p) => p.resource === resource),
    }));
  });
  readonly effective = computed(() => {
    const set = new Set<string>();
    for (const role of this.state().roles) {
      if (role.isActive && this.chosenRoles().has(role.id))
        for (const id of role.permissionIds) set.add(id);
    }
    for (const [id, value] of Object.entries(this.overrides())) {
      if (value === 'allow') set.add(id);
      else set.delete(id);
    }
    return new Set(
      this.state()
        .permissions.filter((p) => p.isActive !== false && set.has(p.id))
        .map((p) => p.id),
    );
  });
  readonly parentOptions = computed(() => [
    { value: '', label: 'Sin grupo padre' },
    ...this.state()
      .menus.filter((m) => !m.route && m.id !== this.selectedId())
      .map((m) => ({ value: m.id, label: m.label })),
  ]);
  readonly permissionOptions = computed(() => [
    { value: '', label: 'Selecciona un permiso de lectura' },
    ...this.state()
      .permissions.filter((p) => p.action === 'read' && p.isActive !== false)
      .map((p) => ({ value: p.id, label: p.name + ' (' + p.code + ')' })),
  ]);
  readonly availableIcons = computed(() => this.state().icons ?? Object.keys(ICON_PATHS));
  readonly overrideOptions = [
    { value: '', label: 'Heredar del rol' },
    { value: 'allow', label: 'Permitir' },
    { value: 'deny', label: 'Denegar' },
  ];
  readonly draftErrors = computed(() => {
    const d = this.draft();
    const errors: Record<string, string> = {};
    if (this.isUser()) return errors;
    if (this.view() !== 'permisos' && !/^[a-z][a-z0-9_-]{0,59}$/.test(d.code))
      errors['code'] = 'Usa letras minusculas, numeros, guion o guion bajo.';
    if (this.view() === 'menus') {
      if (!this.availableIcons().includes(d.icon) || !Object.hasOwn(ICON_PATHS, d.icon))
        errors['icon'] = 'Selecciona un icono existente.';
      if (!d.label.trim() || d.label.trim().length > 100)
        errors['label'] = 'Ingresa un nombre de hasta 100 caracteres.';
      if (d.route && !/^\/admin(?:\/[a-z0-9-]+)*$/.test(d.route))
        errors['route'] = 'Usa una ruta interna /admin.';
      if (d.route && !d.permissionId) errors['permissionId'] = 'Selecciona un permiso de lectura.';
      if (!d.route && d.permissionId) errors['permissionId'] = 'Los grupos no llevan permiso.';
      if (d.section && !/^[a-z0-9_-]{1,60}$/.test(d.section))
        errors['section'] = 'Seccion no valida.';
      if (!Number.isInteger(d.sortOrder) || d.sortOrder < 0 || d.sortOrder > 10000)
        errors['sortOrder'] = 'Orden entre 0 y 10000.';
    } else {
      if (!d.name.trim() || d.name.trim().length > 150)
        errors['name'] = 'Ingresa un nombre de hasta 150 caracteres.';
      if (d.description.length > 500) errors['description'] = 'Maximo 500 caracteres.';
      if (this.view() === 'permisos') {
        if (!/^[a-z][a-z0-9_-]{0,59}$/.test(d.resource)) errors['resource'] = 'Recurso no valido.';
        if (!/^[a-z][a-z0-9_-]{0,39}$/.test(d.action)) errors['action'] = 'Accion no valida.';
      }
    }
    return errors;
  });
  readonly draggingId = signal<string | null>(null);
  readonly dragPoint = signal<{ x: number; y: number } | null>(null);
  readonly draggedMenu = computed(() =>
    this.state().menus.find((menu) => menu.id === this.draggingId()),
  );
  readonly dropTarget = signal<{ id: string; after: boolean } | null>(null);
  readonly orderAnnouncement = signal('');
  readonly dropAfterRowId = computed(() => {
    const drop = this.dropTarget();
    if (!drop?.after) return null;
    const rows = this.menuRows();
    const index = rows.findIndex((row) => row.id === drop.id);
    if (index < 0) return null;
    let last = index;
    while (last + 1 < rows.length && rows[last + 1].depth > rows[index].depth) last++;
    return rows[last].id;
  });
  readonly canReorder = computed(
    () =>
      this.view() === 'menus' &&
      this.access.can('access', 'update') &&
      !this.busy() &&
      !this.query().trim(),
  );
  readonly menuRows = computed(() => {
    const menus = this.state().menus;
    const query = this.query().trim().toLowerCase();
    const visible = new Set<string>();
    for (const item of menus) {
      if (
        query &&
        !(item.label + ' ' + item.code + ' ' + (item.route || '')).toLowerCase().includes(query)
      )
        continue;
      visible.add(item.id);
      let parent = item.parentId;
      const seen = new Set<string>();
      while (parent && !seen.has(parent)) {
        seen.add(parent);
        visible.add(parent);
        parent = menus.find((m) => m.id === parent)?.parentId || null;
      }
    }
    const rows: (AccessMenu & { depth: number })[] = [];
    const walk = (parent: string | null, depth: number) => {
      for (const menu of menus.filter((m) => m.parentId === parent)) {
        if (visible.has(menu.id)) rows.push({ ...menu, depth });
        walk(menu.id, depth + 1);
      }
    };
    walk(null, 0);
    return rows;
  });
  private pointerId: number | null = null;
  startDrag(event: PointerEvent, id: string): void {
    if (!this.canReorder() || event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    event.stopPropagation();
    this.pointerId = event.pointerId;
    this.draggingId.set(id);
    this.dragPoint.set({ x: event.clientX, y: event.clientY });
    this.dropTarget.set(null);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  @HostListener('window:pointermove', ['$event']) moveDrag(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId || !this.draggingId()) return;
    event.preventDefault();
    this.dragPoint.set({ x: event.clientX, y: event.clientY });
    const list = this.host.nativeElement.querySelector<HTMLElement>('.directory-list');
    if (list) {
      const area = list.getBoundingClientRect();
      if (event.clientX >= area.left && event.clientX <= area.right) {
        if (event.clientY < area.top + 36 && event.clientY >= area.top) list.scrollTop -= 16;
        else if (event.clientY > area.bottom - 36 && event.clientY <= area.bottom)
          list.scrollTop += 16;
      }
    }

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-menu-id]');
    const source = this.state().menus.find((m) => m.id === this.draggingId());
    const menu = this.state().menus.find((m) => m.id === target?.dataset['menuId']);
    if (!target || !source || !menu || source.id === menu.id || source.parentId !== menu.parentId) {
      this.dropTarget.set(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    this.dropTarget.set({ id: menu.id, after: event.clientY > rect.top + rect.height / 2 });
  }
  @HostListener('window:pointercancel', ['$event']) cancelDrag(event: PointerEvent): void {
    if (event.pointerId === this.pointerId) this.clearDrag();
  }
  @HostListener('window:keydown.escape') cancelMenuDrag(): void {
    this.clearDrag();
  }
  private clearDrag(): void {
    this.pointerId = null;
    this.draggingId.set(null);
    this.dragPoint.set(null);
    this.dropTarget.set(null);
  }
  @HostListener('window:pointerup', ['$event']) finishDrag(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    const source = this.draggingId();
    const target = this.dropTarget();
    this.clearDrag();
    if (source && target) void this.moveMenu(source, target.id, target.after);
  }
  moveMenuKey(event: KeyboardEvent, id: string): void {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key) || !this.canReorder()) return;
    event.preventDefault();
    const source = this.state().menus.find((m) => m.id === id);
    if (!source) return;
    const siblings = this.state().menus.filter((m) => m.parentId === source.parentId);
    const index = siblings.findIndex((m) => m.id === id);
    const target = siblings[index + (event.key === 'ArrowUp' ? -1 : 1)];
    if (target)
      void this.moveMenu(id, target.id, event.key === 'ArrowDown').then(() =>
        requestAnimationFrame(() =>
          Array.from(
            this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-menu-handle]'),
          )
            .find((button) => button.dataset['menuHandle'] === id)
            ?.focus({ preventScroll: true }),
        ),
      );
  }
  async moveMenu(sourceId: string, targetId: string, after: boolean): Promise<void> {
    if (!this.canReorder()) return;
    const source = this.state().menus.find((m) => m.id === sourceId);
    const target = this.state().menus.find((m) => m.id === targetId);
    if (!source || !target || source.parentId !== target.parentId || source.id === target.id)
      return;
    const original = this.state()
      .menus.filter((m) => m.parentId === source.parentId)
      .map((m) => m.id);
    const order = original.filter((id) => id !== sourceId);
    order.splice(order.indexOf(targetId) + (after ? 1 : 0), 0, sourceId);
    if (order.every((id, i) => id === original[i])) return;
    this.busy.set(true);
    let reload = false;
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/access/menus/order`, {
          parentId: source.parentId,
          menuIds: order,
          expectedMenuIds: original,
        }),
      );
      const ranks = new Map(order.map((id, i) => [id, i * 10]));
      this.state.update((state) => ({
        ...state,
        menus: state.menus
          .map((menu) => (ranks.has(menu.id) ? { ...menu, sortOrder: ranks.get(menu.id)! } : menu))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
      const selected = this.selectedId();
      if (selected && ranks.has(selected)) this.set('sortOrder', ranks.get(selected)!);
      await firstValueFrom(this.access.load(true));
      this.orderAnnouncement.set(
        source.label + ' movido a la posición ' + (order.indexOf(sourceId) + 1),
      );
      this.toast.success('Orden de menús actualizado');
    } catch (error) {
      this.notifyError(error);
      reload = true;
    } finally {
      this.busy.set(false);
    }
    if (reload) {
      await this.load();
      const current = this.state().menus.find((m) => m.id === this.selectedId());
      if (current) this.set('sortOrder', current.sortOrder);
    }
  }
  readonly submitted = signal(false);
  error(field: string): string {
    return this.submitted() ? (this.draftErrors()[field] ?? '') : '';
  }
  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.view.set(params.get('view') ?? 'roles');
        this.query.set('');
        this.page.set(1);
        this.reset();
        void this.load();
      });
    this.typing
      .pipe(
        switchMap((value) =>
          this.isUser() ? timer(350).pipe(switchMap(() => of(value))) : of(value),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.page.set(1);
        if (this.isUser()) void this.loadUsers();
      });
  }
  set(field: keyof Draft, value: string | number | boolean): void {
    this.draft.update((d) => ({ ...d, [field]: value }));
  }
  reset(): void {
    this.selectedId.set(null);
    this.editing.set(false);
    this.readOnly.set(true);
    this.submitted.set(false);
    this.draft.set(blank());
    this.permissionQuery.set('');
    this.userDetails.set(null);
  }
  search(value: string): void {
    this.query.set(value);
    this.typing.next(value);
  }
  async load(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    try {
      this.state.set(
        (
          await firstValueFrom(
            this.http.get<ApiResponse<AccessState>>(`${environment.apiUrl}/access/state`),
          )
        ).data,
      );
      if (this.isUser()) await this.fetchUsers();
      if (this.isAudit())
        this.audit.set(
          (
            await firstValueFrom(
              this.http.get<ApiResponse<AuditEntry[]>>(`${environment.apiUrl}/access/audit`),
            )
          ).data,
        );
    } catch (error) {
      this.failed.set(true);
      this.notifyError(error);
    } finally {
      this.busy.set(false);
    }
  }
  private async fetchUsers(): Promise<void> {
    this.users.set(
      (
        await firstValueFrom(
          this.http.get<
            ApiResponse<{ items: UserRow[]; total: number; page: number; pageSize: number }>
          >(`${environment.apiUrl}/access/users`, {
            params: { search: this.query(), page: this.page(), pageSize: 15 },
          }),
        )
      ).data,
    );
  }
  async loadUsers(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.fetchUsers();
    } catch (e) {
      this.notifyError(e);
    } finally {
      this.busy.set(false);
    }
  }
  turnPage(delta: number): void {
    const page = Math.max(1, Math.min(this.totalPages(), this.page() + delta));
    if (page === this.page()) return;
    this.page.set(page);
    if (this.isUser()) void this.loadUsers();
  }
  async select(id: string): Promise<void> {
    if (this.busy()) return;
    this.selectedId.set(id);
    this.readOnly.set(this.view() !== 'roles' || !this.access.can('access', 'update'));
    this.editing.set(true);
    this.submitted.set(false);
    this.permissionQuery.set('');
    if (this.isUser()) {
      this.busy.set(true);
      try {
        const data = (
          await firstValueFrom(
            this.http.get<ApiResponse<UserAccess>>(`${environment.apiUrl}/access/users/${id}`),
          )
        ).data;
        this.userDetails.set(data);
        this.chosenRoles.set(new Set(data.roleIds));
        this.overrides.set(
          Object.fromEntries(
            data.overrides.map((p) => [p.permissionId, p.isAllowed ? 'allow' : 'deny']),
          ),
        );
      } catch (e) {
        this.reset();
        this.notifyError(e);
      } finally {
        this.busy.set(false);
      }
      return;
    }
    const row =
      this.view() === 'roles'
        ? this.state().roles.find((x) => x.id === id)
        : this.view() === 'permisos'
          ? this.state().permissions.find((x) => x.id === id)
          : this.state().menus.find((x) => x.id === id);
    if (!row) return;
    this.draft.set({
      ...blank(),
      ...row,
      description: ('description' in row ? row.description : '') || '',
      route: ('route' in row ? row.route : '') || '',
      section: ('section' in row ? row.section : '') || '',
      parentId: ('parentId' in row ? row.parentId : '') || '',
      permissionId: ('permissionId' in row ? row.permissionId : '') || '',
    } as Draft);
    this.grantIds.set(new Set('permissionIds' in row ? row.permissionIds : []));
  }
  create(): void {
    this.reset();
    this.editing.set(true);
    this.readOnly.set(false);
    this.grantIds.set(new Set());
  }
  edit(): void {
    if (this.selectedId() && this.access.can('access', 'update') && !this.busy())
      this.readOnly.set(false);
  }
  toggleGrant(id: string, value: boolean): void {
    if (this.readOnly() || this.selectedSystem() || this.busy()) return;
    this.grantIds.update((current) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  toggleRole(id: string, value: boolean): void {
    this.chosenRoles.update((current) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  setOverride(id: string, value: string): void {
    this.overrides.update((current) => {
      const next = { ...current };
      if (value === 'allow' || value === 'deny') next[id] = value;
      else delete next[id];
      return next;
    });
  }
  private notifyError(error: unknown): void {
    const body = (error as HttpErrorResponse)?.error;
    this.toast.error(
      'No pudimos completar la accion',
      body?.errors?.message || body?.message || 'Revisa los datos y tus permisos.',
    );
  }
  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    if (
      this.readOnly() ||
      this.busy() ||
      Object.keys(this.draftErrors()).length ||
      !this.access.can('access', this.selectedId() ? 'update' : 'create')
    )
      return;
    const id = this.selectedId();
    const d = this.draft();
    const body = this.isUser()
      ? {
          roleIds: [...this.chosenRoles()],
          overrides: Object.entries(this.overrides()).map(([permissionId, value]) => ({
            permissionId,
            isAllowed: value === 'allow',
          })),
        }
      : this.view() === 'menus'
        ? {
            ...d,
            parentId: d.parentId || null,
            permissionId: d.permissionId || null,
            route: d.route || null,
            section: d.section || null,
          }
        : { ...d, permissionIds: [...this.grantIds()] };
    this.busy.set(true);
    try {
      const path = `${environment.apiUrl}/access/${this.endpoint()}${id ? '/' + id : ''}`;
      await firstValueFrom(id ? this.http.put(path, body) : this.http.post(path, body));
      this.toast.success('Accesos actualizados');
      await firstValueFrom(this.access.load(true));
      this.reset();
    } catch (e) {
      this.notifyError(e);
    } finally {
      this.busy.set(false);
    }
    await this.load();
  }
  async remove(): Promise<void> {
    const id = this.selectedId();
    if (!id || this.busy() || !this.access.can('access', 'delete')) return;
    if (
      !(await this.dialogs.confirm({
        title: 'Eliminar registro',
        message:
          'Se eliminara ' +
          this.selectedName() +
          '. Las dependencias y los registros protegidos se verifican en el servidor.',
        tone: 'danger',
        confirmLabel: 'Eliminar',
      }))
    )
      return;
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/access/${this.endpoint()}/${id}`),
      );
      this.toast.success('Registro eliminado');
      await firstValueFrom(this.access.load(true));
      this.reset();
    } catch (e) {
      this.notifyError(e);
    } finally {
      this.busy.set(false);
    }
    await this.load();
  }
}
