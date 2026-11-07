import { privateReturnUrl } from '../../../core/auth-navigation';
import { AccessService } from '../../../core/access.service';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Wordmark } from '../../../ui/brand/wordmark/wordmark';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CmsContentService } from '../../../core/cms-content.service';

const HOME_BY_ROLE = { client: '/panel-cliente', admin: '/admin' } as const;

@Component({
  selector: 'app-login',
  imports: [FormsModule, Button, Input, Wordmark, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly access=inject(AccessService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly cms = inject(CmsContentService);

  readonly email = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly pageDesign = computed(() => this.cms.pages().login);
  readonly asideStyle = computed(() => {
    const d = this.pageDesign();
    if (d.backgroundImage) {
      return { 'background-image': `linear-gradient(rgba(11,15,26,0.72), rgba(11,15,26,0.72)), url(${d.backgroundImage})`, 'background-size': 'cover', 'background-position': 'center' };
    }
    if (d.backgroundColor) return { background: d.backgroundColor };
    return {};
  });

  onSubmit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.auth.login(this.email(), this.password()).subscribe({
      next: (user) => {
        this.submitting.set(false);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
        this.access.clear();this.access.load(true).subscribe(session=>{const first=session.menus.find(m=>m.route);const home=session.canAdmin && first ? this.access.link(first) : user.role==='admin'?'/admin/perfil':HOME_BY_ROLE[user.role];this.router.navigateByUrl(privateReturnUrl(redirectTo) ?? home,{replaceUrl:true});});
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('No pudimos iniciar sesión', 'Revisa tu correo y contraseña.');
      },
    });
  }
}
