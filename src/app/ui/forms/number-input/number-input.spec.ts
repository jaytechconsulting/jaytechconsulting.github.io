import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NumberInput } from './number-input';
describe('Branded number input',()=>{
 function setup(){const fixture=TestBed.createComponent(NumberInput);fixture.componentRef.setInput('value','2026');fixture.componentRef.setInput('min',2000);fixture.componentRef.setInput('max',2100);fixture.detectChanges();return fixture;}
 it('increments and decrements through native numeric stepping',()=>{
  const fixture=setup();const input=fixture.componentInstance;const changed=vi.fn();input.valueChange.subscribe(changed);
  input.increment(1);expect(changed).toHaveBeenLastCalledWith('2027');input.increment(-1);expect(changed).toHaveBeenLastCalledWith('2026');
 });
 it('does not exceed bounds or accept steps when disabled',()=>{
  const fixture=setup();const input=fixture.componentInstance;const changed=vi.fn();input.valueChange.subscribe(changed);
  fixture.componentRef.setInput('value','2100');fixture.detectChanges();input.increment(1);expect(changed).not.toHaveBeenCalled();
  fixture.componentRef.setInput('value','2000');fixture.detectChanges();input.increment(-1);expect(changed).not.toHaveBeenCalled();
  fixture.componentRef.setInput('disabled',true);fixture.detectChanges();input.increment(1);expect(changed).not.toHaveBeenCalled();
 });
});
