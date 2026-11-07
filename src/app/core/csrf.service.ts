import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({providedIn:'root'})
export class CsrfService {
 private readonly http=inject(HttpClient);
 private token='';private pending?:Observable<string>;private generation=0;
 clear():void {this.generation++;this.token='';this.pending=undefined;}
 get():Observable<string> {
  if(this.token)return of(this.token);
  if(this.pending)return this.pending;
  const generation=this.generation;
  this.pending=this.http.get<{data:{token:string}}>(`${environment.apiUrl}/auth/csrf`,{withCredentials:true}).pipe(
   map(response=>{if(generation!==this.generation)throw new Error('La sesión cambió.');if(!response.data.token)throw new Error('No se pudo verificar la seguridad de la solicitud.');return response.data.token;}),
   tap(token=>this.token=token),finalize(()=>{if(generation===this.generation)this.pending=undefined;}),shareReplay({bufferSize:1,refCount:false}));
  return this.pending;
 }
}
