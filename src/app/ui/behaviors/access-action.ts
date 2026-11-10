import { Directive, inject, input } from '@angular/core';
import { AccessService } from '../../core/access/access.service';
/** UI affordance only; the API independently checks every protected operation. */
@Directive({
  selector: '[appAccessAction]',
  host: { '[style.display]': "access.allowed(appAccessAction()) ? null : 'none'" },
})
export class AccessAction {
  readonly appAccessAction = input.required<string>();
  readonly access = inject(AccessService);
}
