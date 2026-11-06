import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from './api.service';
export interface CatalogItem {
 id:number;code:string;name:string;description?:string|null;order:number;icon?:string|null;color?:string|null;
 inputKind:'text'|'digits'|'integer'|'decimal';minLength:number|null;maxLength:number|null;minValue:number|null;maxValue:number|null;
}
export interface CatalogDetails {code:string;name:string;items:CatalogItem[];}
export function catalogValueValid(rule:CatalogItem|undefined,value:string):boolean {
 if(!rule)return false;
 if(rule.minLength!==null && value.length<rule.minLength || rule.maxLength!==null && value.length>rule.maxLength)return false;
 if(rule.inputKind==='digits' && !/^[0-9]+$/.test(value))return false;
 if(rule.inputKind==='integer' || rule.inputKind==='decimal' || rule.minValue!==null || rule.maxValue!==null){
  if(!/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(value))return false;
  const number=Number(value);if(!Number.isFinite(number) || rule.inputKind==='integer' && !Number.isInteger(number))return false;
  if(rule.minValue!==null && number<rule.minValue || rule.maxValue!==null && number>rule.maxValue)return false;
 }
 return true;
}
@Injectable({providedIn:'root'})
export class CatalogService {
 private readonly api=inject(ApiService);
 profile(){return forkJoin({documents:this.api.catalogDetails('TIPO_DOCUMENTO'),sex:this.api.catalogDetails('SEXO')});}
}
