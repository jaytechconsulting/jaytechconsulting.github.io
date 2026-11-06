import { Component, input, output } from '@angular/core';
@Component({selector:'app-checkbox',templateUrl:'./checkbox.html',styleUrl:'./checkbox.css'})
export class Checkbox {
 readonly checked=input(false);readonly disabled=input(false);readonly indeterminate=input(false);readonly label=input('Seleccionar');readonly text=input('');
 readonly checkedChange=output<boolean>();
 change(event:Event):void {if(!this.disabled())this.checkedChange.emit((event.target as HTMLInputElement).checked);}
}
