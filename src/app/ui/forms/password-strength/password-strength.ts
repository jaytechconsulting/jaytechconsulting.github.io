import { Component, computed, input } from '@angular/core';
import { Icon } from '../../data-display/icon/icon';
export function passwordRequirements(value:string){return [
 {label:'10 caracteres como mínimo',valid:value.length>=10},
 {label:'Una mayúscula',valid:/\p{Lu}/u.test(value)},
 {label:'Una minúscula',valid:/\p{Ll}/u.test(value)},
 {label:'Un número',valid:/\p{Nd}/u.test(value)},
 {label:'Un carácter especial',valid:/[^\p{L}\p{N}]/u.test(value)},
];}
export function passwordMeetsPolicy(value:string):boolean{return passwordRequirements(value).every(check=>check.valid);}
@Component({selector:'app-password-strength',imports:[Icon],templateUrl:'./password-strength.html',styleUrl:'./password-strength.css'})
export class PasswordStrength {
 readonly value=input('');readonly checks=computed(()=>passwordRequirements(this.value()));
 readonly level=computed(()=>!this.value()?0:passwordMeetsPolicy(this.value())?(this.value().length>=14?4:3):this.checks().filter(check=>check.valid).length>=3?2:1);
 readonly label=computed(()=>['Sin evaluar','Baja','Media','Buena','Alta'][this.level()]);
}
