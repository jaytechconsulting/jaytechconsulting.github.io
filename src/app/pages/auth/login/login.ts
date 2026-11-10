import { backgroundStyle } from '../../../ui/styles/background-style';
import { privateReturnUrl } from '../../../core/auth/auth-navigation';
import { AccessService } from '../../../core/access/access.service';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Wordmark } from '../../../ui/brand/wordmark/wordmark';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CmsContentService } from '../../../core/cms/cms-content.service';

const HOME_BY_ROLE = { client: '/panel-cliente', admin: '/admin' } as const;

@Component({
  selector: 'app-login',
  imports: [FormsModule, Button, Input, Wordmark, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly access = inject(AccessService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly cms = inject(CmsContentService);

  readonly email = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly pageDesign = computed(() => this.cms.pages().login);
  readonly asideStyle = computed(() => backgroundStyle(this.pageDesign()));

  onSubmit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.auth.login(this.email(), this.password()).subscribe({
      next: (user) => {
        this.submitting.set(false);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
        this.access.clear();
        this.access.load(true).subscribe((session) => {
          const first = session.menus.find((m) => m.route);
          const home =
            session.canAdmin && first
              ? this.access.link(first)
              : user.role === 'admin'
                ? '/admin/perfil'
                : HOME_BY_ROLE[user.role];
          this.router.navigateByUrl(privateReturnUrl(redirectTo) ?? home, { replaceUrl: true });
        });
      },
      error: (error) => {
        this.submitting.set(false);
        const code = error?.error?.errors?.code ?? error?.error?.code;
        if (code === 'csrf_invalid') {
          this.toast.error(
            'No pudimos validar la seguridad del acceso',
            'El navegador no pudo enviar la cookie de seguridad. Revisa las cookies de este sitio.',
          );
          return;
        }
        this.toast.error('No pudimos iniciar sesión', 'Revisa tu correo y contraseña.');
      },
    });
  }
}
