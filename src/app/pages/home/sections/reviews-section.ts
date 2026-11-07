import { Component, computed, inject, signal } from '@angular/core';
import { CmsContentService } from '../../../core/cms-content.service';
import { Reveal } from '../../../core/directives/reveal';

interface Review {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  photo: string;
  rating: number;
  color: string;
}

const EMPTY_REVIEW: Review = {
  quote: 'Aún no hay reseñas publicadas.',
  name: 'Jaytech',
  role: 'Equipo',
  company: 'Jaytech',
  initials: 'JT',
  photo: '',
  rating: 5,
  color: '#22D3EE',
};

const STARS = [0, 1, 2, 3, 4];

@Component({
  selector: 'app-reviews-section',
  imports: [Reveal],
  templateUrl: './reviews-section.html',
})
export class ReviewsSection {
  private readonly cms = inject(CmsContentService);
  readonly reviews = computed<Review[]>(() =>
    this.cms.reviews().map((item) => ({
      quote: item.quote,
      name: item.name,
      role: item.role,
      company: item.company,
      initials: this.initials(item.name),
      photo: item.photo,
      rating: Number(item.rating) || 5,
      color: item.color || '#22D3EE',
    })),
  );
  readonly stars = STARS;
  readonly content = this.cms.section('reviews');
  readonly summary = computed(() => {
    const [score, caption] = this.content().items.split('|').map((part) => part.trim());
    return { score: score || '4.9', caption: caption || 'basado en proyectos publicados' };
  });

  readonly active = signal(0);
  readonly activeReview = computed(() => this.reviews()[this.active()] ?? this.reviews()[0] ?? EMPTY_REVIEW);

  select(index: number): void {
    this.active.set(index);
  }

  avatarButtonClasses(index: number): string {
    const on = index === this.active();
    return [
      'cursor-pointer rounded-full border-2 p-0 transition-transform duration-200 ease-out',
      on ? 'scale-[1.06]' : 'scale-100',
    ].join(' ');
  }

  avatarClasses(index: number): string {
    const on = index === this.active();
    return [
      'm-0.5 inline-flex h-12 w-12 items-center justify-center rounded-full font-display text-base font-bold',
      on ? 'bg-[image:var(--gradient-hud)] text-ink-950 opacity-100' : 'bg-surface-sunken text-text-muted opacity-75',
    ].join(' ');
  }

  private initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
  }
}
