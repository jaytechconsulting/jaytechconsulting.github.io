import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Wordmark } from '../../../ui/brand/wordmark/wordmark';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface StrengthLevel {
  label: string;
  color: string;
}

interface Requirement {
  label: string;
  ok: boolean;
}

const LEVELS: StrengthLevel[] = [
  { label: '—', color: 'var(--border-default)' },
  { label: 'Débil', color: 'var(--danger)' },
  { label: 'Aceptable', color: 'var(--brand-yellow)' },
  { label: 'Buena', color: 'var(--brand-cyan)' },
  { label: 'Fuerte', color: 'var(--success)' },
];

function strengthOf(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

/** Destination of the reset-password email link — reads `?token=` from the URL. */
@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, Button, Input, Wordmark, RouterLink],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly hasToken = !!this.token;

  readonly password = signal('');
  readonly confirm = signal('');
  readonly done = signal(false);
  readonly submitting = signal(false);

  readonly bars = [0, 1, 2, 3];
  readonly strength = computed(() => strengthOf(this.password()));
  readonly strengthLevel = computed(() => LEVELS[this.strength()]);

  readonly requirements = computed<Requirement[]>(() => [
    { label: 'Mínimo 8 caracteres', ok: this.password().length >= 8 },
    {
      label: 'Mayúsculas y minúsculas',
      ok: /[A-Z]/.test(this.password()) && /[a-z]/.test(this.password()),
    },
    { label: 'Al menos un número', ok: /\d/.test(this.password()) },
  ]);

  readonly match = computed(() => this.password().length > 0 && this.password() === this.confirm());
  readonly confirmError = computed(() =>
    this.confirm().length > 0 && !this.match() ? 'Las contraseñas no coinciden' : undefined,
  );
  readonly valid = computed(() => this.strength() >= 2 && this.match());

  submit(): void {
    debugger;
    if (!this.valid() || this.submitting() || !this.hasToken) return;
    this.submitting.set(true);
    this.auth.resetPassword(this.token, this.password()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('El enlace no es válido', 'Puede haber caducado. Solicita uno nuevo.');
      },
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
