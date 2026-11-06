import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { RecordEditor } from './record-editor';
describe('Module record editor',()=>{
 let http:HttpTestingController;
 beforeEach(()=>{
   TestBed.configureTestingModule({imports:[RecordEditor],providers:[provideHttpClient(),provideHttpClientTesting()]});
   http=TestBed.inject(HttpTestingController);
   Object.defineProperty(HTMLDialogElement.prototype,'showModal',{value:vi.fn(),configurable:true});
   Object.defineProperty(HTMLDialogElement.prototype,'close',{value:vi.fn(),configurable:true});
 });
 afterEach(()=>http.verify());
 function open(resource:string){
   const fixture=TestBed.createComponent(RecordEditor);fixture.componentRef.setInput('resource',resource);
   fixture.componentRef.setInput('row',{id:'record-1',name:'Original',detail:'',client:'',status:'',role:'',progress:0,createdAt:''});
   fixture.detectChanges();return fixture.componentInstance;
 }
 it('preserves unedited project fields when saving',()=>{
   const editor=open('proyectos');
   http.expectOne(r=>r.url.endsWith('/projects/admin/record-1')).flush({data:{title:'Original',clientName:'Cliente',category:'Web',year:2026,progress:20,status:'En desarrollo',description:'Texto',imageUrl:'existing.webp',tags:['web'],isPublished:true,displayOrder:3}});
   editor.set('title','Nuevo nombre');editor.save(new Event('submit'));
   const request=http.expectOne(r=>r.method==='PUT');
   expect(request.request.body.title).toBe('Nuevo nombre');expect(request.request.body.imageUrl).toBe('existing.webp');expect(request.request.body.tags).toEqual(['web']);
   request.flush({data:{}});
 });
 it('sends the supported numeric status for tickets and blocks repeat saves',()=>{
   const editor=open('tickets');http.expectOne(r=>r.url.endsWith('/tickets/record-1')).flush({data:{title:'Ticket',description:'Texto',status:0}});
   editor.set('status','InProgress');editor.save(new Event('submit'));editor.save(new Event('submit'));
   const request=http.expectOne(r=>r.method==='PATCH');expect(request.request.body).toEqual({status:2});request.flush({data:{}});
 });
});
