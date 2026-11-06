import { TestBed } from '@angular/core/testing';
import { PasswordStrength, passwordMeetsPolicy } from './password-strength';
describe('Password strength',()=>{
 it('starts empty, advances through levels and shows the meter accessibly',()=>{
  const fixture=TestBed.createComponent(PasswordStrength);fixture.detectChanges();expect(fixture.componentInstance.level()).toBe(0);
  for(const [value,level] of [['abc',1],['Abc1',2],['Secure123!',3],['LongSecure123!Pass',4]] as const){fixture.componentRef.setInput('value',value);fixture.detectChanges();expect(fixture.componentInstance.level()).toBe(level);expect(fixture.nativeElement.querySelector('[role=meter]').getAttribute('aria-valuenow')).toBe(String(level));}
 });
 it('requires every rule, including for long passwords, and supports accented letters',()=>{
  expect(passwordMeetsPolicy('abcdefghijklmnop')).toBe(false);expect(passwordMeetsPolicy('Abcdefghij1')).toBe(false);expect(passwordMeetsPolicy('Ábcdefghij1!')).toBe(true);
 });
});
