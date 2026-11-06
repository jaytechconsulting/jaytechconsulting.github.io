import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {UsersService,AdminUserInput} from './users.service';
const user={id:'u1',name:'Ana Garcia Lopez',email:'ana@example.com',role:'client',isActive:true,createdAt:'2026-11-01T00:00:00Z',givenNames:'Ana',paternalSurname:'Garcia',maternalSurname:'Lopez',documentType:'DNI',documentNumber:'12345678',phone:'999999999',contactEmail:'contact@example.com',sex:'F',avatarUrl:'https://example.com/avatar.jpg',avatarZoom:1.5,avatarX:30,avatarY:60};
const draft:AdminUserInput={...user,role:'client',password:'Temporary123!'};
describe('Full administrative user transport',()=>{
 let http:HttpTestingController;let service:UsersService;
 beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});http=TestBed.inject(HttpTestingController);service=TestBed.inject(UsersService);});afterEach(()=>http.verify());
 it('fetches all personal fields for editing',()=>{let loaded:any;service.get('u1').subscribe(value=>loaded=value);http.expectOne(r=>r.url.endsWith('/users/u1')).flush({data:user});expect(loaded).toMatchObject({givenNames:'Ana',paternalSurname:'Garcia',maternalSurname:'Lopez',phone:'999999999',documentNumber:'12345678',avatarZoom:1.5});});
 it('sends personal fields on create and update, without sending a password on update',()=>{service.create(draft).subscribe();const create=http.expectOne(r=>r.url.endsWith('/users'));expect(create.request.body).toMatchObject({givenNames:'Ana',sex:'F',documentType:'DNI',phone:'999999999',password:'Temporary123!',role:'Client'});create.flush({data:user});service.update('u1',draft).subscribe();const update=http.expectOne(r=>r.url.endsWith('/users/u1'));expect(update.request.body).toMatchObject({givenNames:'Ana',contactEmail:'contact@example.com',avatarZoom:1.5});expect(update.request.body.password).toBeUndefined();update.flush({data:user});});
});
