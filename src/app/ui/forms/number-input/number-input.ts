import { Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { Icon } from '../../data-display/icon/icon';
let uid=0;
@Component({selector:'app-number-input',imports:[Icon],templateUrl:'./number-input.html',styleUrl:'./number-input.css'})
export class NumberInput {
 readonly label=input('Número');readonly value=input('');readonly placeholder=input('Ingresa un número');
 readonly min=input<number>();readonly max=input<number>();readonly step=input(1);readonly disabled=input(false);readonly required=input(false);
 readonly valueChange=output<string>();readonly field=viewChild<ElementRef<HTMLInputElement>>('field');readonly id=`number-input-${++uid}`;
 readonly atMin=computed(()=>this.value()!=='' && this.min()!==undefined && Number(this.value())<=this.min()!);
 readonly atMax=computed(()=>this.value()!=='' && this.max()!==undefined && Number(this.value())>=this.max()!);
 increment(direction:1|-1):void {
  const field=this.field()?.nativeElement;if(!field || this.disabled() || field.matches(':disabled'))return;
  if(direction===1 && this.atMax() || direction===-1 && this.atMin())return;
  if(direction===1)field.stepUp();else field.stepDown();
  this.valueChange.emit(field.value);field.focus();
 }
}
