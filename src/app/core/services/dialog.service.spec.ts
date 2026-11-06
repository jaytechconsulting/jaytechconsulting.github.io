import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
describe('Shared dialogs',()=>{
  it('asks a question and resolves the explicit confirmation',async()=>{
    const dialogs=TestBed.inject(DialogService);const answer=dialogs.question({title:'¿Cerrar sesión?'});
    expect(dialogs.dialog()?.tone).toBe('info');dialogs.close(true);expect(await answer).toBe(true);expect(dialogs.dialog()).toBeNull();
  });
  it('cancels a previous question and handles cancellation and alerts',async()=>{
    const dialogs=TestBed.inject(DialogService);const first=dialogs.confirm({title:'Eliminar',tone:'danger'});
    const second=dialogs.alert({title:'Información'});expect(await first).toBe(false);expect(dialogs.dialog()?.cancelLabel).toBeNull();
    dialogs.close(false);expect(await second).toBe(false);
  });
});
