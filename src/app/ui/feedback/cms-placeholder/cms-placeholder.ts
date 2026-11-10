import { Component, input, output } from '@angular/core';
import { Button } from '../../actions/button/button';
@Component({
  selector: 'app-cms-placeholder',
  imports: [Button],
  templateUrl: './cms-placeholder.html',
  styleUrl: './cms-placeholder.css',
})
export class CmsPlaceholder {
  readonly hero = input(false);
  readonly error = input(false);
  readonly retry = output<void>();
}
