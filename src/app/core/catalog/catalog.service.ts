import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);
  profile() {
    return forkJoin({
      documents: this.api.catalogDetails('TIPO_DOCUMENTO'),
      sex: this.api.catalogDetails('SEXO'),
    });
  }
}
