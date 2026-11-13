import { Component, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import type { CmsCompany } from '../../../core/cms/cms.models';
import { dominantColor } from '../../../ui/behaviors/dominant-color';
import { Reveal } from '../../../ui/behaviors/reveal';
import { CountUp } from '../../../ui/data-display/count-up/count-up';

/** Tiles the ribbon needs to cover a wide screen before it repeats. */
const MIN_RIBBON_ITEMS = 8;
/** Overall figures shown when the CMS section has none, one "value | label" per line. */
const DEFAULT_RESULTS = ['+40 | proyectos entregados', '12 | sectores atendidos', '98% | clientes que repiten'];
/** Brand colours the result cards cycle through. */
const RESULT_COLORS = ['var(--brand-orange)', 'var(--brand-cyan)', 'var(--brand-yellow)'];

/** A figure such as "+40" or "98%" split so the number can be animated. */
interface Metric {
  prefix: string;
  value: number | null;
  decimals: number;
  separator: string;
  unit: string;
  /** Text after the figure, or the whole text when it has no figure. */
  rest: string;
  /** The figure is a reduction (a leading minus), so its trend line goes down. */
  falling: boolean;
}

/** Fourth screen of the home: the companies Jaytech worked with, as a light block after the dark
 * courses band. A ribbon of company logos gives the social proof; below, cards with Jaytech's
 * overall figures (not tied to any company), which count up when they scroll into view. Hidden
 * while there are no published companies. */
@Component({
  selector: 'app-clients-section',
  imports: [Reveal, CountUp],
  templateUrl: './clients-section.html',
  styles: `
    .clients-row {
      animation: clients-row 46s linear infinite;
    }
    /* The ribbon is rendered twice, so moving half its width loops without a jump. */
    @keyframes clients-row {
      to {
        transform: translate3d(-50%, 0, 0);
      }
    }

    .clients-result::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease-out;
      background: radial-gradient(
        380px circle at var(--mx, 50%) var(--my, 0%),
        color-mix(in srgb, var(--tile-color) 24%, transparent),
        transparent 65%
      );
    }
    .clients-result:hover::before {
      opacity: 1;
    }

    /* Trend line: drawn once the card is revealed. */
    .clients-trend path {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transition: stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s;
    }
    li.is-revealed .clients-trend path {
      stroke-dashoffset: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .clients-row {
        animation: none;
        flex-wrap: wrap;
        justify-content: center;
        width: 100%;
      }
      .clients-row-copy {
        display: none;
      }
      .clients-trend path {
        transition: none;
      }
    }
  `,
})
export class ClientsSection {
  private readonly cms = inject(CmsContentService);

  readonly clients = this.cms.companies;
  /** Companies repeated until the ribbon is long enough to cover the screen. */
  readonly ribbon = computed<CmsCompany[]>(() => {
    const clients = this.clients();
    if (!clients.length) return [];
    return Array.from(
      { length: Math.ceil(MIN_RIBBON_ITEMS / clients.length) },
      () => clients,
    ).flat();
  });

  /** Colour read from each logo, by logo source: it tints the tile on hover. */
  readonly logoColors = signal<ReadonlyMap<string, string>>(new Map());

  private readonly stored = this.cms.section('clients');
  /** The CMS section can be empty; the block still needs a heading. */
  readonly content = computed(() => {
    const stored = this.stored();
    return {
      ...stored,
      eyebrow: stored.eyebrow || 'Confían en nosotros',
      title: stored.title || 'Empresas que crecieron',
      highlight: stored.title ? stored.highlight : 'con nosotros',
    };
  });
  readonly results = computed(() => {
    const lines = this.stored().items.split('\n').filter((line) => line.trim());
    return (lines.length ? lines : DEFAULT_RESULTS)
      .map((line, index) => {
        const [value, label] = line.split('|').map((part) => part.trim());
        return {
          metric: parseMetric(value ?? ''),
          label: label || '',
          color: RESULT_COLORS[index % RESULT_COLORS.length],
        };
      })
      .filter((result) => result.metric.value !== null || result.metric.rest);
  });

  constructor() {
    // Reading pixels needs a canvas, so the colours are worked out in the browser after render.
    afterRenderEffect(() => {
      const logos = [...new Set(this.clients().map((client) => client.logo))].filter(
        (logo) => logo && !this.logoColors().has(logo),
      );
      for (const logo of logos)
        void dominantColor(logo).then((color) => {
          if (color) this.logoColors.update((colors) => new Map(colors).set(logo, color));
        });
    });
  }

  /** Moves the card's glow under the pointer. */
  spotlight(event: PointerEvent): void {
    const card = event.currentTarget as HTMLElement;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - box.left}px`);
    card.style.setProperty('--my', `${event.clientY - box.top}px`);
  }
}

/** Splits "+3.2×" into sign, figure and unit. Text without a figure is kept whole. */
function parseMetric(text: string): Metric {
  const match = /^(\D*?)(\d+(?:[.,]\d+)?)(\S*)\s*(.*)$/.exec(text.trim());
  if (!match)
    return {
      prefix: '',
      value: null,
      decimals: 0,
      separator: '.',
      unit: '',
      rest: text.trim(),
      falling: false,
    };
  const [, prefix, figure, unit, rest] = match;
  return {
    prefix: prefix.trim(),
    value: Number(figure.replace(',', '.')),
    decimals: figure.split(/[.,]/)[1]?.length ?? 0,
    separator: figure.includes(',') ? ',' : '.',
    unit,
    rest,
    falling: /[-−–]/.test(prefix),
  };
}
