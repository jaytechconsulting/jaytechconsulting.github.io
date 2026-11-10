import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Wordmark } from '../../../ui/brand/wordmark/wordmark';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

const EMAIL_RE = /.+@.+\..+/;

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, Button, Input, Wordmark, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly email = signal('');
  readonly sent = signal(false);
  readonly submitting = signal(false);

  readonly valid = computed(() => EMAIL_RE.test(this.email()));

  submit(): void {
    if (!this.valid() || this.submitting()) return;
    this.submitting.set(true);
    this.auth.requestPasswordReset(this.email()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
        this.toast.success(
          'Solicitud enviada',
          'Revisa tu bandeja de entrada y la carpeta de spam.',
        );
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('No pudimos enviar el enlace', 'Inténtalo nuevamente en unos momentos.');
      },
    });
  }

  useAnotherEmail(): void {
    this.sent.set(false);
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
