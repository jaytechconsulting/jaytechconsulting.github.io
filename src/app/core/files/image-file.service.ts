import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ImageFileOptions {
  maxBytes?: number;
  types?: readonly string[];
  verifyImage?: boolean;
}
export class ImageFileError extends Error {
  constructor(
    readonly reason: 'type' | 'size' | 'read' | 'decode',
    message: string,
  ) {
    super(message);
  }
}

/** Reads images locally. Upload/persistence is owned by the calling feature. */
@Injectable({ providedIn: 'root' })
export class ImageFileService {
  read(file: File, options: ImageFileOptions = {}): Observable<string> {
    return new Observable<string>((subscriber) => {
      if (
        !file.type.startsWith('image/') ||
        (options.types && !options.types.includes(file.type))
      ) {
        subscriber.error(new ImageFileError('type', 'Selecciona un archivo de imagen permitido.'));
        return;
      }
      const maxBytes = options.maxBytes ?? 1024 * 1024;
      if (file.size > maxBytes) {
        subscriber.error(
          new ImageFileError(
            'size',
            `La imagen debe pesar como máximo ${Math.round(maxBytes / 1024)} KB.`,
          ),
        );
        return;
      }
      const reader = new FileReader();
      let image: HTMLImageElement | undefined;
      const fail = (reason: 'read' | 'decode') =>
        subscriber.error(
          new ImageFileError(reason, 'No pudimos abrir la imagen. Inténtalo con otro archivo.'),
        );
      reader.onerror = () => fail('read');
      reader.onload = () => {
        const result = String(reader.result);
        const complete = () => {
          subscriber.next(result);
          subscriber.complete();
        };
        if (!options.verifyImage) {
          complete();
          return;
        }
        image = new Image();
        image.onload = complete;
        image.onerror = () => fail('decode');
        image.src = result;
      };
      reader.readAsDataURL(file);
      return () => {
        reader.onload = null;
        reader.onerror = null;
        if (reader.readyState === FileReader.LOADING) reader.abort();
        if (image) {
          image.onload = null;
          image.onerror = null;
        }
      };
    });
  }
}
