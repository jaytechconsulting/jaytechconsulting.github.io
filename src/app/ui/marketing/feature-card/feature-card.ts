import { Component, input, output } from '@angular/core';
import { Button } from '../../actions/button/button';

/**
 * Richer public-facing card for listing pages (programs, courses, etc.) — distinct from the
 * generic admin `app-card` list rows. Image/gradient banner, floating accent badge, animated
 * gradient-ring hover border, clamped copy and a "ver más detalles" action. The image itself
 * is clickable — it opens the same full detail page as the button.
 */
@Component({
  selector: 'app-feature-card',
  imports: [Button],
  templateUrl: './feature-card.html',
  styleUrl: './feature-card.css',
})
export class FeatureCard {
  readonly image = input<string | null>(null);
  readonly accentColor = input('#FF6B35');
  readonly glyph = input('◆');
  readonly badges = input<string[]>([]);
  readonly title = input('');
  readonly description = input('');

  readonly viewDetails = output<void>();
  readonly imageClick = output<void>();
}
