import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Select } from './select';
describe('Custom select',()=>{
  function setup(){
    const fixture=TestBed.createComponent(Select);
    fixture.componentRef.setInput('options',[{value:'',label:'Todos'},'Ándes','Lima','Piura']);
    fixture.componentRef.setInput('label','Ciudad');fixture.detectChanges();
    const select=fixture.componentInstance;
    select.panel()!.nativeElement.showPopover=vi.fn();select.panel()!.nativeElement.hidePopover=vi.fn();
    vi.spyOn(window,'requestAnimationFrame').mockImplementation(()=>0);
    return {fixture,select};
  }
  afterEach(()=>vi.restoreAllMocks());
  it('filters accented labels and emits a selection using the keyboard',()=>{
    const {select}=setup();const changed=vi.fn();select.valueChange.subscribe(changed);
    select.show();select.search('andes');
    expect(select.filtered().map(x=>x.label)).toEqual(['Ándes']);
    select.keydown(new KeyboardEvent('keydown',{key:'Enter',cancelable:true}));
    expect(changed).toHaveBeenCalledWith('Ándes');expect(select.open()).toBe(false);
  });
  it('moves through options and Escape cancels without changing the value',()=>{
    const {select}=setup();const changed=vi.fn();select.valueChange.subscribe(changed);select.show();
    select.keydown(new KeyboardEvent('keydown',{key:'ArrowDown',cancelable:true}));expect(select.activeIndex()).toBe(1);
    select.keydown(new KeyboardEvent('keydown',{key:'End',cancelable:true}));expect(select.activeIndex()).toBe(3);
    select.keydown(new KeyboardEvent('keydown',{key:'Escape',cancelable:true}));expect(select.open()).toBe(false);expect(changed).not.toHaveBeenCalled();
  });
  it('does not open when disabled and displays an empty search result',()=>{
    const {fixture,select}=setup();fixture.componentRef.setInput('disabled',true);fixture.detectChanges();select.show();expect(select.open()).toBe(false);
    select.search('missing');fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Sin coincidencias');
  });
});
