import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Checkbox } from './checkbox';
describe('Branded checkbox',()=>{
 it('keeps native keyboard semantics and emits a single selection change',()=>{
  const fixture=TestBed.createComponent(Checkbox);fixture.componentRef.setInput('label','Seleccionar Ana');fixture.detectChanges();
  const changed=vi.fn();fixture.componentInstance.checkedChange.subscribe(changed);
  const input=fixture.nativeElement.querySelector('input') as HTMLInputElement;
  input.click();expect(input.type).toBe('checkbox');expect(input.getAttribute('aria-label')).toBe('Seleccionar Ana');expect(changed).toHaveBeenCalledExactlyOnceWith(true);
 });
 it('supports disabled and mixed states without emitting changes',()=>{
  const fixture=TestBed.createComponent(Checkbox);fixture.componentRef.setInput('disabled',true);fixture.componentRef.setInput('indeterminate',true);fixture.detectChanges();
  const changed=vi.fn();fixture.componentInstance.checkedChange.subscribe(changed);const input=fixture.nativeElement.querySelector('input') as HTMLInputElement;
  expect(input.indeterminate).toBe(true);input.click();expect(changed).not.toHaveBeenCalled();
 });
});
