import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Checkbox } from '../../../ui/forms/checkbox/checkbox';
import { Icon } from '../../../ui/data-display/icon/icon';
import type { AdminRow } from '../admin-table/admin-table';
@Component({selector:'app-admin-record-card',imports:[DatePipe,Checkbox,Icon],templateUrl:'./admin-record-card.html',styleUrl:'./admin-record-card.css'})
export class AdminRecordCard {
 readonly record=input.required<AdminRow>();readonly resource=input.required<string>();readonly columns=input<{key:string;label:string}[]>([]);readonly tone=input('neutral');readonly isSelected=input(false);readonly selectedChange=output<void>();
 displayRole(role:string):string{return role==='admin'?'Administrador':role==='client'?'Cliente':role;}
 cell(row:AdminRow,key:string):string|number{return row[key as keyof AdminRow];}
}
