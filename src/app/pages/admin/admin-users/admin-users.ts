import { ROLE_META } from './role-meta';
import {
  Component,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
  HostListener,
  DestroyRef,
  afterRenderEffect,
} from '@angular/core';
import { forkJoin, of, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminShell } from '../admin-shell/admin-shell';
import { AdminTable, AdminRow } from '../admin-table/admin-table';
import { UsersService, AdminUser, AdminUserInput } from '../../../core/users/users.service';
import { CatalogService } from '../../../core/catalog/catalog.service';
import type { CatalogItem } from '../../../core/catalog/catalog.models';
import { catalogValueValid } from '../../../core/catalog/catalog.validation';
import { ApiService } from '../../../core/api.service';
import { AccessService } from '../../../core/access/access.service';
import {
  profilePhoneValid,
  profileEmailValid,
  profileNameValid,
  profileLegalNameValid,
} from '../../../core/validation/profile-validation';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Select } from '../../../ui/forms/select/select';
import {
  PasswordStrength,
  passwordMeetsPolicy,
} from '../../../ui/forms/password-strength/password-strength';
import { Avatar } from '../../../ui/data-display/avatar/avatar';
import { Icon } from '../../../ui/data-display/icon/icon';
import { OverlayScroll } from '../../../ui/behaviors/overlay-scroll';
import { closeModal } from '../../../ui/feedback/modal-motion';
interface EditingState {
  id: string | null;
  draft: AdminUserInput;
}
const blank = (): AdminUserInput => ({
  name: '',
  email: '',
  role: 'client',
  password: '',
  givenNames: '',
  paternalSurname: '',
  maternalSurname: '',
  documentType: '',
  documentNumber: '',
  phone: '',
  contactEmail: '',
  sex: '',
  avatarUrl: '',
  avatarZoom: 1,
  avatarX: 50,
  avatarY: 50,
});
@Component({
  selector: 'app-admin-users',
  imports: [
    AdminShell,
    AdminTable,
    Button,
    Input,
    Select,
    PasswordStrength,
    Avatar,
    Icon,
    OverlayScroll,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers {
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly usersService = inject(UsersService);
  private readonly catalogs = inject(CatalogService);
  private readonly api = inject(ApiService);
  private readonly destroy = inject(DestroyRef);
  readonly access = inject(AccessService);
  readonly roleMeta = ROLE_META;
  readonly accountTypes = [
    { value: 'client', label: 'Cliente' },
    { value: 'admin', label: 'Administrador' },
  ];
  readonly readOnly = signal(false);
  readonly editing = signal<EditingState | null>(null);
  readonly selectedUser = signal<AdminUser | null>(null);
  readonly saving = signal(false);
  readonly closing = signal(false);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly touched = signal<Record<string, boolean>>({});
  readonly submitted = signal(false);
  readonly serverErrors = signal<Record<string, string>>({});
  readonly documents = signal<CatalogItem[]>([]);
  readonly sexes = signal<CatalogItem[]>([]);
  readonly userModal = viewChild<ElementRef<HTMLElement>>('userModal');
  readonly table = viewChild(AdminTable);
  readonly isNew = computed(() => this.editing()?.id === null);
  readonly original = signal<AdminUser | null>(null);
  readonly documentRule = computed(() =>
    this.documents().find((item) => item.code === this.editing()?.draft.documentType),
  );
  readonly documentOptions = computed(() => {
    const options = this.documents().map((item) => ({ value: item.code, label: item.name }));
    const current = this.original()?.documentType;
    if (current && !options.some((item) => item.value === current))
      options.push({ value: current, label: current });
    return [{ value: '', label: 'Selecciona un tipo' }, ...options];
  });
  readonly sexOptions = computed(() => {
    const options = this.sexes().map((item) => ({ value: item.code, label: item.name }));
    const current = this.original()?.sex;
    if (current && !options.some((item) => item.value === current))
      options.push({ value: current, label: current });
    return [{ value: '', label: 'Selecciona una opcion' }, ...options];
  });
  readonly lookupState = signal<'idle' | 'waiting' | 'loading' | 'success' | 'manual'>('idle');
  readonly lookupError = signal('');
  readonly namesLocked = computed(
    () =>
      this.readOnly() ||
      (['DNI', 'RUC'].includes(this.editing()?.draft.documentType ?? '') &&
        this.lookupState() !== 'manual'),
  );
  private loadRequest?: Subscription;
  private lookupRequest?: Subscription;
  private lookupTimer?: ReturnType<typeof setTimeout>;
  private lastLookup = '';
  private previousFocus: HTMLElement | null = null;
  private previousOverflow = '';
  private locked = false;
  private initialFocus = false;
  readonly errors = computed<Record<string, string>>(() => {
    const d = this.editing()?.draft;
    if (!d) return {};
    const errors: Record<string, string> = {};
    if (!d.givenNames.trim()) errors['givenNames'] = 'Ingresa los nombres.';
    for (const field of ['givenNames', 'paternalSurname', 'maternalSurname'] as const)
      if (
        !(field === 'givenNames' && d.documentType === 'RUC'
          ? profileLegalNameValid(d[field])
          : profileNameValid(d[field]))
      )
        errors[field] =
          field === 'givenNames' && d.documentType === 'RUC'
            ? 'Ingresa una razon social de hasta 150 caracteres.'
            : 'Usa letras, espacios, apostrofes, puntos o guiones; maximo 100 caracteres.';
    if (d.name.length > 150)
      errors['givenNames'] = 'El nombre completo admite hasta 150 caracteres.';
    if (!d.email.trim() || !profileEmailValid(d.email))
      errors['email'] = 'Ingresa un correo de acceso valido.';
    if (!profilePhoneValid(d.phone))
      errors['phone'] =
        'Ingresa un celular de 9 digitos que empiece en 9 o un numero internacional con +.';
    if (!profileEmailValid(d.contactEmail))
      errors['contactEmail'] = 'Ingresa un correo de contacto valido.';
    if (!d.documentType && d.documentNumber)
      errors['documentType'] = 'Selecciona el tipo de documento.';
    if (d.documentType && !d.documentNumber)
      errors['documentNumber'] = 'Ingresa el numero de documento.';
    const unchanged =
      d.documentType === this.original()?.documentType &&
      d.documentNumber === this.original()?.documentNumber;
    if (d.documentType && !this.documentRule() && !unchanged)
      errors['documentType'] = 'Selecciona un tipo de documento disponible.';
    if (
      d.documentNumber &&
      (d.documentNumber.length > 100 ||
        !/^[\p{L}\p{N}-]+$/u.test(d.documentNumber) ||
        (this.documentRule() && !catalogValueValid(this.documentRule(), d.documentNumber)))
    )
      errors['documentNumber'] = 'El documento no cumple el formato requerido.';
    if (d.documentType === 'DNI' && !/^[0-9]{8}$/.test(d.documentNumber))
      errors['documentNumber'] = 'El DNI debe contener 8 digitos.';
    if (d.documentType === 'RUC' && !/^[0-9]{11}$/.test(d.documentNumber))
      errors['documentNumber'] = 'El RUC debe contener 11 digitos.';
    if (
      d.sex &&
      !this.sexes().some((item) => item.code === d.sex) &&
      d.sex !== this.original()?.sex
    )
      errors['sex'] = 'Selecciona una opcion valida.';
    if (!['admin', 'client'].includes(d.role))
      errors['role'] = 'Selecciona un tipo de cuenta valido.';
    if (this.isNew() && !passwordMeetsPolicy(d.password))
      errors['password'] = 'Usa al menos 10 caracteres, mayuscula, minuscula, numero y simbolo.';
    if (d.avatarUrl?.trim()) {
      try {
        const url = new URL(d.avatarUrl.trim());
        if (
          url.protocol !== 'https:' ||
          url.username ||
          url.password ||
          d.avatarUrl.trim().length > 2048
        )
          errors['avatarUrl'] = 'Ingresa un enlace HTTPS valido.';
      } catch {
        errors['avatarUrl'] = 'Ingresa un enlace HTTPS valido.';
      }
    }
    return errors;
  });
  constructor() {
    this.destroy.onDestroy(() => {
      this.loadRequest?.unsubscribe();
      this.cancelLookup();
      this.unlockScroll();
    });
    afterRenderEffect(() => {
      if (this.editing() && !this.loading() && !this.initialFocus) {
        const modal = this.userModal()?.nativeElement;
        if (!modal) return;
        this.initialFocus = true;
        modal
          .querySelector<HTMLElement>('input:not(:disabled),button:not(:disabled)')
          ?.focus({ preventScroll: true });
      }
    });
  }
  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }
  fieldError(field: string): string {
    return (
      this.serverErrors()[field] ||
      (this.submitted() || this.touched()[field] ? this.errors()[field] || '' : '')
    );
  }
  touch(field: string): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
    if (field === 'documentNumber') this.lookupDocument();
  }
  setField<K extends keyof AdminUserInput>(key: K, value: AdminUserInput[K]): void {
    this.serverErrors.update((errors) => {
      const next = { ...errors };
      delete next[key];
      return next;
    });
    this.editing.update((state) => {
      if (!state) return state;
      const draft = { ...state.draft, [key]: value };
      draft.name = [draft.givenNames, draft.paternalSurname, draft.maternalSurname]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' ');
      if (key === 'avatarUrl') {
        draft.avatarZoom = 1;
        draft.avatarX = 50;
        draft.avatarY = 50;
      }
      return { ...state, draft };
    });
  }
  openNew(): void {
    if (!this.access.can('users', 'create')) return;
    this.begin(null);
    this.loadData();
  }
  editRow(row: AdminRow): void {
    this.openEdit({
      id: row.id,
      name: row.name,
      email: row.detail,
      role: row.role.toLowerCase() === 'admin' ? 'admin' : 'client',
      isActive: row.status === 'Activo',
      createdAt: row.createdAt,
    });
  }
  viewRow(row: AdminRow): void {
    if (!this.access.can('users', 'read')) return;
    this.begin(
      {
        id: row.id,
        name: row.name,
        email: row.detail,
        role: row.role.toLowerCase() === 'admin' ? 'admin' : 'client',
        isActive: row.status === 'Activo',
        createdAt: row.createdAt,
      },
      true,
    );
    this.loadData(row.id);
  }
  enableEditing(): void {
    if (this.access.can('users', 'update') && !this.loading()) this.readOnly.set(false);
  }
  openEdit(user: AdminUser): void {
    if (!this.access.can('users', 'update')) return;
    this.begin(user);
    this.loadData(user.id);
  }
  private begin(user: AdminUser | null, readOnly = false): void {
    this.readOnly.set(readOnly);
    this.loadRequest?.unsubscribe();
    this.cancelLookup();
    this.selectedUser.set(user);
    this.original.set(user);
    this.touched.set({});
    this.submitted.set(false);
    this.serverErrors.set({});
    this.loadFailed.set(false);
    this.initialFocus = false;
    this.lookupState.set('idle');
    this.lookupError.set('');
    this.loading.set(true);
    if (!this.locked) {
      this.previousFocus = document.activeElement as HTMLElement;
      this.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.locked = true;
    }
    this.editing.set({ id: user?.id ?? null, draft: user ? this.draftFrom(user) : blank() });
  }
  private draftFrom(user: AdminUser): AdminUserInput {
    return {
      ...blank(),
      name: user.name,
      email: user.email,
      role: user.role,
      givenNames: user.documentType === 'RUC' ? user.name : (user.givenNames ?? user.name),
      paternalSurname: user.documentType === 'RUC' ? '' : (user.paternalSurname ?? ''),
      maternalSurname: user.documentType === 'RUC' ? '' : (user.maternalSurname ?? ''),
      documentType: user.documentType ?? '',
      documentNumber: user.documentNumber ?? '',
      phone: user.phone ?? '',
      contactEmail: user.contactEmail ?? '',
      sex: user.sex ?? '',
      avatarUrl: user.avatarUrl ?? '',
      avatarZoom: user.avatarZoom ?? 1,
      avatarX: user.avatarX ?? 50,
      avatarY: user.avatarY ?? 50,
    };
  }
  private loadData(id?: string): void {
    this.loadRequest = forkJoin({
      user: id ? this.usersService.get(id) : of(null),
      catalogs: this.catalogs.profile(),
    })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: ({ user, catalogs }) => {
          if (!this.editing()) return;
          this.documents.set(catalogs.documents.items);
          this.sexes.set(catalogs.sex.items);
          if (user) {
            this.selectedUser.set(user);
            this.original.set(user);
            this.editing.set({ id: user.id, draft: this.draftFrom(user) });
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
          this.toast.error(
            'No pudimos cargar los datos del usuario',
            'Cierra el formulario e intentalo nuevamente.',
          );
        },
      });
  }
  private cancelLookup(): void {
    clearTimeout(this.lookupTimer);
    this.lookupRequest?.unsubscribe();
    this.lastLookup = '';
  }
  changeDocumentType(value: string): void {
    const previous = this.editing()?.draft.documentType;
    this.cancelLookup();
    this.setField('documentType', value);
    this.setField('documentNumber', '');
    this.lookupState.set('waiting');
    this.lookupError.set('');
    if (['DNI', 'RUC'].includes(value) || ['DNI', 'RUC'].includes(previous ?? '')) {
      this.setField('givenNames', '');
      this.setField('paternalSurname', '');
      this.setField('maternalSurname', '');
    }
    this.touch('documentType');
  }
  changeDocumentNumber(value: string): void {
    value = value.trim();
    if (this.editing()?.draft.documentNumber === value) return;
    this.cancelLookup();
    this.setField('documentNumber', value);
    this.lookupState.set('waiting');
    this.lookupError.set('');
    const type = this.editing()?.draft.documentType;
    if (type === 'DNI' || type === 'RUC') {
      this.setField('givenNames', '');
      this.setField('paternalSurname', '');
      this.setField('maternalSurname', '');
      if ((type === 'DNI' ? /^[0-9]{8}$/ : /^[0-9]{11}$/).test(value))
        this.lookupTimer = setTimeout(() => this.lookupDocument(), 500);
    }
  }
  lookupDocument(): void {
    if (this.readOnly()) return;
    clearTimeout(this.lookupTimer);
    const d = this.editing()?.draft;
    if (!d || !['DNI', 'RUC'].includes(d.documentType)) return;
    const type = d.documentType,
      number = d.documentNumber.trim(),
      key = type + ':' + number;
    if (!(type === 'DNI' ? /^[0-9]{8}$/ : /^[0-9]{11}$/).test(number) || this.lastLookup === key)
      return;
    this.lastLookup = key;
    const manual = () => {
      this.lookupState.set('manual');
      this.lookupError.set(
        type === 'RUC'
          ? 'No pudimos obtener la razon social. Puedes completarla manualmente.'
          : 'No pudimos obtener los nombres. Puedes completarlos manualmente.',
      );
    };
    if (!this.access.can('documents', 'read')) {
      manual();
      return;
    }
    this.lookupState.set('loading');
    this.lookupRequest = this.api
      .lookupDocument(type, number)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (result) => {
          if (
            this.editing()?.draft.documentNumber !== number ||
            this.editing()?.draft.documentType !== type
          )
            return;
          const name = type === 'RUC' ? result.legalName || result.fullName : result.givenNames;
          const fullName =
            type === 'RUC'
              ? name
              : [name, result.paternalSurname, result.maternalSurname].filter(Boolean).join(' ');
          if (
            !name?.trim() ||
            (type === 'RUC'
              ? !profileLegalNameValid(name)
              : !profileNameValid(name) ||
                !profileNameValid(result.paternalSurname ?? '') ||
                !profileNameValid(result.maternalSurname ?? '')) ||
            (fullName?.length ?? 0) > 150
          ) {
            manual();
            return;
          }
          this.setField('givenNames', name.trim());
          this.setField('paternalSurname', type === 'DNI' ? (result.paternalSurname ?? '') : '');
          this.setField('maternalSurname', type === 'DNI' ? (result.maternalSurname ?? '') : '');
          this.lookupState.set('success');
          this.lookupError.set('');
        },
        error: () => {
          if (
            this.editing()?.draft.documentNumber === number &&
            this.editing()?.draft.documentType === type
          )
            manual();
        },
      });
  }
  draftValid(): boolean {
    return (
      !!this.editing() && !Object.keys(this.errors()).length && this.lookupState() !== 'loading'
    );
  }
  save(): void {
    this.submitted.set(true);
    const state = this.editing();
    if (
      !state ||
      this.readOnly() ||
      !this.draftValid() ||
      this.saving() ||
      this.loading() ||
      this.loadFailed() ||
      this.closing() ||
      !this.access.can('users', state.id ? 'update' : 'create')
    )
      return;
    this.saving.set(true);
    const request = state.id
      ? this.usersService.update(state.id, state.draft)
      : this.usersService.create(state.draft);
    request.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (user) => {
        this.saving.set(false);
        void this.closeDrawer();
        this.table()?.refresh();
        this.toast.success(state.id ? 'Usuario actualizado' : 'Usuario creado', user.name);
      },
      error: (error) => {
        this.saving.set(false);
        const payload = error?.error;
        const fields = payload?.errors?.fieldErrors;
        if (fields)
          this.serverErrors.set(
            Object.fromEntries(
              Object.entries(fields).map(([field, messages]) => [field, (messages as string[])[0]]),
            ),
          );
        this.toast.error(
          'No pudimos guardar el usuario',
          payload?.errors?.message || payload?.message || 'Revisa los campos del formulario.',
        );
      },
    });
  }
  isInactive(id: string | null): boolean {
    return !!id && this.selectedUser()?.id === id && this.selectedUser()?.isActive === false;
  }
  async deleteFromDrawer(): Promise<void> {
    const state = this.editing();
    if (!state?.id || this.saving() || this.dialog.dialog() || !this.access.can('users', 'delete'))
      return;
    if (
      !(await this.dialog.confirm({
        tone: 'danger',
        title: 'Inactivar usuario',
        message: state.draft.name + ' dejara de tener acceso a la plataforma.',
        confirmLabel: 'Inactivar',
      }))
    )
      return;
    this.saving.set(true);
    this.usersService
      .remove(state.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.closeDrawer();
          this.table()?.refresh();
          this.toast.success('Usuario inactivado');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('No pudimos inactivar el usuario');
        },
      });
  }
  activateFromDrawer(): void {
    const id = this.editing()?.id;
    if (!id || this.saving() || !this.access.can('users', 'update')) return;
    this.saving.set(true);
    this.usersService
      .activate(id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.closeDrawer();
          this.table()?.refresh();
          this.toast.success('Usuario activado');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('No pudimos activar el usuario');
        },
      });
  }
  private unlockScroll(): void {
    if (this.locked) {
      document.body.style.overflow = this.previousOverflow;
      this.locked = false;
    }
  }
  async closeDrawer(): Promise<void> {
    if (this.saving() || this.closing()) return;
    this.closing.set(true);
    this.loadRequest?.unsubscribe();
    this.cancelLookup();
    await closeModal(this.userModal()?.nativeElement);
    this.editing.set(null);
    this.closing.set(false);
    this.unlockScroll();
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true });
  }
  @HostListener('document:keydown.escape') onEscape(): void {
    if (this.editing() && !this.dialog.dialog()) void this.closeDrawer();
  }
  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) void this.closeDrawer();
  }
  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || this.dialog.dialog()) return;
    const elements = Array.from(
      this.userModal()?.nativeElement.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
      ) ?? [],
    ).filter((element) => element.getClientRects().length > 0);
    if (!elements.length) return;
    const first = elements[0],
      last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
