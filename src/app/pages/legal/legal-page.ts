import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CmsContentService } from '../../core/cms/cms-content.service';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { Icon } from '../../ui/data-display/icon/icon';
import { Button } from '../../ui/actions/button/button';
import { backgroundStyle } from '../../ui/styles/background-style';

@Component({
  selector: 'app-legal-page',
  imports: [Header, Footer, RouterLink, Icon, Button],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.css',
})
export class LegalPage {
  readonly cms = inject(CmsContentService);
  private readonly router = inject(Router);
  private readonly data = toSignal(inject(ActivatedRoute).data);
  readonly kind = computed(() =>
    this.data()?.['legalPage'] === 'avisos-legales' ? 'avisos-legales' : 'terminos-y-condiciones',
  );
  readonly title = computed(() =>
    this.kind() === 'avisos-legales' ? 'Avisos legales' : 'Términos y condiciones',
  );
  readonly page = computed(() => this.cms.pages()[this.kind()]);
  readonly heroStyle = computed(() => backgroundStyle(this.page()));
  readonly paragraphs = computed(() =>
    (this.page().content ?? '')
      .split(/\n\s*\n/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((block) => {
        const heading = /^##[ \t]+([^\r\n]+)\r?\n([\s\S]*)$/.exec(block);
        return heading ? { title: heading[1].trim(), body: heading[2] } : { title: '', body: block };
      }),
  );
  proposal(): void {
    void this.router.navigateByUrl('/solicitar-propuesta');
  }
  retry(): void {
    this.cms.load(false).subscribe({ error: () => undefined });
  }
}
