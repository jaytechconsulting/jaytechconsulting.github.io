import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AdminPreloading } from './admin-preloading';
import { AccessService } from './access.service';

describe('Admin code preloading', () => {
  it('preloads admin modules only after backend access has been verified', () => {
    let ready = false;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AccessService,
          useValue: { loaded: () => ready, session: () => ({ canAdmin: ready }) },
        },
      ],
    });
    const strategy = TestBed.inject(AdminPreloading),
      load = vi.fn(() => of('module'));
    strategy.preload({ path: 'admin/usuarios' }, load).subscribe();
    expect(load).not.toHaveBeenCalled();
    ready = true;
    strategy.preload({ path: 'admin/usuarios' }, load).subscribe();
    expect(load).toHaveBeenCalledOnce();
    strategy.preload({ path: 'login' }, load).subscribe();
    expect(load).toHaveBeenCalledOnce();
  });
});
