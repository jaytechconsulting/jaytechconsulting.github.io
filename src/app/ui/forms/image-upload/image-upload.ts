import { Component, input, output } from '@angular/core';
import { Button } from '../../actions/button/button';
import { ImageFile } from '../../behaviors/image-file';

@Component({
  selector: 'app-image-upload',
  imports: [Button, ImageFile],
  templateUrl: './image-upload.html',
})
export class ImageUpload {
  readonly label = input.required<string>();
  readonly value = input('');
  readonly hint = input<string>();
  readonly circle = input(false);
  readonly resetKey = input<unknown>();
  readonly valueChange = output<string>();
  readonly uploadError = output<string>();
}
