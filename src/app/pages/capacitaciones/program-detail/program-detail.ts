import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../ui/navigation/header/header';
import { Footer } from '../../../ui/navigation/footer/footer';
import { Button } from '../../../ui/actions/button/button';
import { Badge } from '../../../ui/data-display/badge/badge';
import { Breadcrumb } from '../../../ui/navigation/breadcrumb/breadcrumb';
import { Reveal } from '../../../core/directives/reveal';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { CmsContentService } from '../../../core/cms-content.service';
import { ApiService } from '../../../core/api.service';
import { SeoService } from '../../../core/services/seo.service';
import type { ApiTrainingProgram } from '../../../core/models/api.models';

/** Full detail page for one training program — reached by clicking a Capacitaciones card's
 * image or "ver más detalles" button. Same shared header/footer shell as the listing page. */
@Component({
  selector: 'app-program-detail',
  imports: [Header, Footer, Button, Badge, Breadcrumb, WhatsAppFab, Reveal],
  templateUrl: './program-detail.html',
  styleUrl: './program-detail.css',
})
export class ProgramDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly cms = inject(CmsContentService);
  private readonly seo = inject(SeoService);

  readonly header = this.cms.header;
  readonly program = signal<ApiTrainingProgram | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly breadcrumb = computed(() => [
    { label: 'Inicio', href: '/' },
    { label: 'Programas', href: '/capacitaciones' },
    { label: this.program()?.title ?? '' },
  ]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.notFound.set(false);
      this.api.trainingProgram(id).subscribe({
        next: (program) => {
          this.program.set(program);
          this.loading.set(false);
          this.seo.update({
            title: `${program.title} | Jaytech`,
            description: program.description,
            path: `/capacitaciones/${program.id}`,
            image: program.imageUrl ?? undefined,
          });
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
          this.seo.update({
            title: 'Programa no encontrado | Jaytech',
            description: 'El programa de capacitación solicitado no está disponible.',
            path: this.router.url,
            index: false,
          });
        },
      });
    });
  }

  back(): void {
    this.router.navigate(['/capacitaciones']);
  }

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
