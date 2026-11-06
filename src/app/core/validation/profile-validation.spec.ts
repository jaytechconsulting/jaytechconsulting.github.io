import {profilePhoneValid,profileEmailValid,normalizeProfilePhone,profileNameValid} from './profile-validation';
describe('Profile validation rules',()=>{
 it('accepts local and international mobile formats and rejects incomplete or invalid phones',()=>{
  for(const value of ['999999999','+51 999 999 999','+1 (202) 555-0123',''])expect(profilePhoneValid(value),value).toBe(true);
  for(const value of ['123456','99999','899999999','+51 123456789','+1234567890123456','()--- ','999999999abc'])expect(profilePhoneValid(value),value).toBe(false);
  expect(normalizeProfilePhone('+51 999-999-999')).toBe('+51999999999');
 });
 it('validates email syntax and length without accepting display names',()=>{
  for(const value of ['ana@example.com','ana+admin@sub.example.com',''])expect(profileEmailValid(value),value).toBe(true);
  for(const value of ['a..b@example.com','.a@example.com','a@example','a@-example.com','Ana <a@example.com>','a b@example.com','a'.repeat(65)+'@example.com'])expect(profileEmailValid(value),value).toBe(false);
 });
 it('rejects digits, control characters and excessive lengths in names',()=>{
  expect(profileNameValid('Ana Maria')).toBe(true);expect(profileNameValid("O'Connor")).toBe(true);
  for(const value of ['Ana123','Ana\nMaria','A'.repeat(101)])expect(profileNameValid(value)).toBe(false);
 });
});
