import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** "Inicio → Sección → Página actual" trail. The last item (or any item without `href`)
 * renders as plain text — everything else is a link. `inverse` switches to light-on-dark
 * colors for use inside a dark hero banner. */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {
  readonly items = input<BreadcrumbItem[]>([]);
  readonly inverse = input(false);
}
