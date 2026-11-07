import { Component, input } from '@angular/core';

/** Global top-edge progress for initial navigation, route guards and HTTP requests. */
@Component({
  selector: 'app-nav-progress-bar',
  templateUrl: './nav-progress-bar.html',
  styleUrl: './nav-progress-bar.css',
})
export class NavProgressBar {
  readonly visible = input(false);
  readonly color = input('');
}
