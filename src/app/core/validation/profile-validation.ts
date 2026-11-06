export function normalizeProfilePhone(value:string):string{return value.trim().replace(/[ ()-]/g,'');}
export function profilePhoneValid(value:string):boolean {
 const raw=value.trim();if(!raw)return true;if(raw.length>32 || !/^\+?[0-9 ()-]+$/.test(raw))return false;
 const phone=normalizeProfilePhone(raw);
 return phone.startsWith('+51') ? /^\+519[0-9]{8}$/.test(phone) : /^9[0-9]{8}$/.test(phone) || /^\+[1-9][0-9]{7,14}$/.test(phone);
}
export function profileEmailValid(value:string):boolean {
 const email=value.trim();if(!email)return true;if(email.length>254)return false;
 const parts=email.split('@');const local=parts[0];if(parts.length!==2 || local.length>64 || local.startsWith('.') || local.endsWith('.') || local.includes('..'))return false;
 return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(email);
}
export function profileNameValid(value:string):boolean {const text=value.trim();return !text || text.length<=100 && /^[\p{L}\p{M}][\p{L}\p{M} .\u2019'\-]*$/u.test(text);}

export function profileLegalNameValid(value:string):boolean {const text=value.trim();return text.length>0 && text.length<=150 && /[\p{L}\p{N}]/u.test(text) && /^[\p{L}\p{M}\p{N}\p{P}\p{S} ]+$/u.test(text);}
