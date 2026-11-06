import { vi } from 'vitest';
import { closeModal } from './modal-motion';
describe('Modal exit animation',()=>{
 it('waits for the exit animation before allowing the view to be removed',async()=>{
  const panel=document.createElement('div');let finish!:()=>void;
  const finished=new Promise<void>(resolve=>finish=resolve);
  panel.animate=vi.fn().mockReturnValue({finished});let removed=false;
  const pending=closeModal(panel).then(()=>removed=true);
  expect(removed).toBe(false);expect(panel.animate).toHaveBeenCalledOnce();finish();await pending;expect(removed).toBe(true);
 });
 it('does not block closing when animation is unavailable',async()=>{await expect(closeModal(undefined)).resolves.toBeUndefined();});
});
