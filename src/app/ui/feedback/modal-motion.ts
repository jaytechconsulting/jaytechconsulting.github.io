/** Keep the modal mounted until its exit transition has finished. */
export async function closeModal(element: HTMLElement | undefined): Promise<void> {
 if(!element || !element.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 element.getAnimations?.().forEach(animation=>animation.cancel());
 try {await element.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(12px) scale(.97)'}],{duration:180,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).finished;} catch { /* A removed view cancels its animation. */ }
}
