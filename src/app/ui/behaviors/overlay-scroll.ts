import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/** Draws a scrollbar over the scrollport, without reserving layout space. */
@Directive({selector:'[appOverlayScroll]'})
export class OverlayScroll {
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
 private readonly destroy=inject(DestroyRef);
 constructor(){afterNextRender(()=>this.attach());}
 private attach():void {
  const host=this.host,parent=host.parentElement;if(!parent)return;
  const thumb=document.createElement('div');thumb.className='overlay-scroll-thumb';thumb.setAttribute('aria-hidden','true');parent.appendChild(thumb);
  let timer:ReturnType<typeof setTimeout>|undefined;let dragging=false;let pointerY=0;let initialScroll=0;
  const update=()=>{
   const overflow=host.scrollHeight-host.clientHeight;
   const rect=host.getBoundingClientRect(),outer=parent.getBoundingClientRect();
   const height=Math.max(22,host.clientHeight*host.clientHeight/host.scrollHeight);
   thumb.style.display=overflow>1 && host.clientHeight>0?'block':'none';
   thumb.style.height=height+'px';
   thumb.style.top=(rect.top-outer.top-parent.clientTop+(overflow>0?host.scrollTop/overflow*(host.clientHeight-height):0))+'px';
   thumb.style.right=Math.max(2,outer.right-rect.right-parent.clientLeft+2)+'px';
  };
  const show=()=>{update();thumb.classList.add('is-visible');clearTimeout(timer);timer=setTimeout(()=>{if(!dragging)thumb.classList.remove('is-visible');},850);};
  const move=(event:PointerEvent)=>{if(!dragging)return;const range=host.clientHeight-thumb.offsetHeight;if(range>0)host.scrollTop=initialScroll+(event.clientY-pointerY)*(host.scrollHeight-host.clientHeight)/range;show();};
  const end=()=>{dragging=false;show();};
  const start=(event:PointerEvent)=>{event.preventDefault();dragging=true;pointerY=event.clientY;initialScroll=host.scrollTop;thumb.setPointerCapture(event.pointerId);show();};
  host.addEventListener('scroll',show,{passive:true});host.addEventListener('pointerenter',show);
  thumb.addEventListener('pointerdown',start);thumb.addEventListener('pointermove',move);thumb.addEventListener('pointerup',end);thumb.addEventListener('lostpointercapture',end);
  const resize=new ResizeObserver(update);resize.observe(host);resize.observe(parent);
  const mutations=new MutationObserver(update);mutations.observe(host,{childList:true,subtree:true,characterData:true});
  update();
  this.destroy.onDestroy(()=>{clearTimeout(timer);resize.disconnect();mutations.disconnect();host.removeEventListener('scroll',show);host.removeEventListener('pointerenter',show);thumb.remove();});
 }
}
