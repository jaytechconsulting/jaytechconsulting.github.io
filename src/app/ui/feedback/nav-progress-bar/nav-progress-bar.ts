import { Component, input } from '@angular/core';

/** Slim indeterminate loading bar shown above the topbar on route
 * transitions after the first app boot (which uses the full-screen Loader
 * instead). Purely a transition indicator — not tied to HTTP request state. */
@Component({
  selector: 'app-nav-progress-bar',
  templateUrl: './nav-progress-bar.html',
  styleUrl: './nav-progress-bar.css',
})
export class NavProgressBar {
  readonly visible = input(false);
  readonly inset = input(false);
  readonly color = input('');
}
