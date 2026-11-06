import { OverlayScroll } from '../../behaviors/overlay-scroll';
import { Component, ElementRef, HostListener, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { Icon } from '../../data-display/icon/icon';
let uid = 0;
export type SelectOption = string | {value:string;label:string};
@Component({selector:'app-select',imports:[Icon,OverlayScroll],templateUrl:'./select.html',styleUrl:'./select.css'})
export class Select {
  readonly label=input<string>(); readonly hint=input<string>(); readonly error=input<string>();
  readonly id=input<string>(); readonly value=input(''); readonly options=input<SelectOption[]>([]);
  readonly placeholder=input('Selecciona…'); readonly disabled=input(false); readonly required=input(false);
  readonly hideLabel=input(false); readonly inlineLabel=input(false); readonly searchable=input(true); readonly compact=input(false); readonly valueChange=output<string>();
  private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
  readonly panel=viewChild<ElementRef<HTMLElement>>('panel'); readonly searchField=viewChild<ElementRef<HTMLInputElement>>('searchField');
  readonly trigger=viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly generatedId=`app-select-${++uid}`;
  readonly fieldId=computed(()=>this.id() || this.generatedId);
  readonly open=signal(false); readonly query=signal(''); readonly activeIndex=signal(0);
  readonly position=signal({left:0,top:0,width:240,maxHeight:300});
  readonly normalizedOptions=computed(()=>this.options().map(o=>typeof o === 'string' ? {value:o,label:o}:o));
  readonly selectedLabel=computed(()=>this.normalizedOptions().find(o=>o.value===this.value())?.label ?? this.placeholder());
  readonly filtered=computed(()=>{const q=this.query().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return this.normalizedOptions().filter(o=>o.label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));});
  toggle():void {if(this.open())this.close();else this.show();}
  show():void {
    if(this.disabled())return;
    this.query.set('');this.activeIndex.set(Math.max(0,this.normalizedOptions().findIndex(o=>o.value===this.value())));
    const rect=this.trigger()!.nativeElement.getBoundingClientRect();
    const width=Math.min(Math.max(rect.width,240),window.innerWidth-24);
    const below=window.innerHeight-rect.bottom-16;const above=rect.top-16;
    const height=Math.min(320,Math.max(below,above));
    const useBelow=below>=Math.min(320,above);
    this.position.set({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:useBelow ? rect.bottom+8 : Math.max(8,rect.top-height-8),width,maxHeight:height});
    this.open.set(true);this.panel()!.nativeElement.showPopover();
    requestAnimationFrame(()=>{if(!useBelow)this.position.update(p=>({...p,top:Math.max(8,rect.top-this.panel()!.nativeElement.getBoundingClientRect().height-8)}));(this.searchable() ? this.searchField()?.nativeElement : this.panel()?.nativeElement)?.focus();this.scrollActive();});
  }
  close(restore=false):void {this.panel()?.nativeElement.hidePopover();this.open.set(false);if(restore)this.trigger()?.nativeElement.focus();}
  choose(value:string):void {this.valueChange.emit(value);this.close(true);}
  search(value:string):void {this.query.set(value);this.activeIndex.set(0);}
  keydown(event:KeyboardEvent):void {
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.close(true);return;}
    if(event.key==='Tab'){this.close(true);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();if(!this.open()){this.show();return;}
      const last=this.filtered().length-1;
      this.activeIndex.set(event.key==='Home'?0:event.key==='End'?Math.max(0,last):Math.max(0,Math.min(last,this.activeIndex()+(event.key==='ArrowDown'?1:-1))));
      requestAnimationFrame(()=>this.scrollActive());
    }else if(event.key==='Enter' && this.open()){event.preventDefault();const option=this.filtered()[this.activeIndex()];if(option)this.choose(option.value);}
  }
  private scrollActive():void {this.panel()?.nativeElement.querySelector(`#${this.fieldId()}-option-${this.activeIndex()}`)?.scrollIntoView({block:'nearest'});}
  @HostListener('document:pointerdown',['$event']) outside(event:PointerEvent):void {if(this.open() && !this.host.nativeElement.contains(event.target as Node))this.close();}
  @HostListener('window:resize') resize():void {if(this.open())this.close();}
  @HostListener('window:scroll') scroll():void {if(this.open())this.close();}
}
