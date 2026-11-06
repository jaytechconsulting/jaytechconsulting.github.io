import { ToastService } from '../../../core/services/toast.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AdminTable } from './admin-table';

describe('Admin table filters', () => {
  let http: HttpTestingController;
  let table: AdminTable;
  beforeEach(() => {
    TestBed.configureTestingModule({imports:[AdminTable],providers:[provideHttpClient(),provideHttpClientTesting()]});
    http=TestBed.inject(HttpTestingController);
    const fixture=TestBed.createComponent(AdminTable);
    fixture.componentRef.setInput('resource','usuarios');
    table=fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(r=>r.url.endsWith('/admin/lists/usuarios')).flush({data:{items:[],total:0,page:1,pageSize:10,totalPages:0}});
  });
  afterEach(()=>{http.verify();vi.useRealTimers();});
  it('waits until typing stops and Enter cancels the pending debounce',()=>{
    vi.useFakeTimers();
    table.searchChanged('ma');vi.advanceTimersByTime(200);
    table.searchChanged('maria');vi.advanceTimersByTime(200);
    http.expectNone(r=>r.url.includes('/admin/lists/'));
    table.searchNow();
    const request=http.expectOne(r=>r.params.get('search')==='maria');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({data:{items:[],total:0,page:1,pageSize:10,totalPages:0}});
    vi.advanceTimersByTime(400);
    http.expectNone(r=>r.url.includes('/admin/lists/'));
  });
  it('applies a search after the pause without requiring Enter',()=>{
    vi.useFakeTimers();table.searchChanged('ana');vi.advanceTimersByTime(350);
    http.expectOne(r=>r.params.get('search')==='ana').flush({data:{items:[],total:0,page:1,pageSize:10,totalPages:0}});
  });
  it('clears all filters, cancels pending text and resets the page',()=>{
    vi.useFakeTimers();table.role.set('admin');table.status.set('Activo');table.page.set(3);
    table.searchChanged('pending');table.clearFilters();
    const request=http.expectOne(r=>r.params.get('search')==='' && r.params.get('status')==='' && r.params.get('role')==='');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({data:{items:[],total:0,page:1,pageSize:10,totalPages:0}});
    vi.advanceTimersByTime(400);http.expectNone(r=>r.url.includes('/admin/lists/'));
    expect(table.searchInput()).toBe('');
  });
  it('only enables selection actions for a selected row and clears selection on refresh',()=>{
    const row={id:'test',name:'Ana',detail:'ana@example.test',client:'',status:'Activo',role:'client',progress:0,createdAt:'2026-01-01'};
    table.select(row);expect(table.selected()?.id).toBe('test');
    table.select(row);expect(table.selected()).toBeNull();
    table.select(row);table.refresh();expect(table.selected()).toBeNull();
    http.expectOne(r=>r.url.includes('/admin/lists/')).flush({data:{items:[],total:0,page:1,pageSize:10,totalPages:0}});
    expect(table.statusTone('Activo')).toBe('success');expect(table.statusTone('En desarrollo')).toBe('warning');
  });
  it('notifies only after the refresh succeeds, including reload and clearing filters',()=>{
    const success=vi.spyOn(TestBed.inject(ToastService),'success');
    for(const [action,title] of [ ['update','Tabla actualizada'],['reload','Tabla recargada'],['clear','Filtros limpiados'] ] as const){
      success.mockClear();if(action==='clear')table.clearFilters();else table.refresh(action);
      expect(success).not.toHaveBeenCalled();
      http.expectOne(r=>r.url.includes('/admin/lists/')).flush({data:{items:[],total:2,page:1,pageSize:10,totalPages:1}});
      expect(success).toHaveBeenCalledExactlyOnceWith(title,'2 registros encontrados.',2500);
    }
    success.mockClear();table.refresh('reload');
    http.expectOne(r=>r.url.includes('/admin/lists/')).flush({}, {status:500,statusText:'Error'});
    expect(success).not.toHaveBeenCalled();
  });
  it('uses server ordering and pagination from mobile controls',()=>{
    table.mobileSort('createdAt');
    http.expectOne(r=>r.params.get('sort')==='createdAt' && r.params.get('page')==='1').flush({data:{items:[],total:25,page:1,pageSize:10,totalPages:3}});
    table.toggleDirection();
    http.expectOne(r=>r.params.get('direction')==='desc').flush({data:{items:[],total:25,page:1,pageSize:10,totalPages:3}});
    table.go(2);
    http.expectOne(r=>r.params.get('page')==='2' && r.params.get('sort')==='createdAt' && r.params.get('direction')==='desc').flush({data:{items:[],total:25,page:2,pageSize:10,totalPages:3}});
    expect(table.page()).toBe(2);
  });
  it('requests every offered page size from the server',()=>{
    for(const size of [10,15,25,50,100]) {
      table.page.set(4);table.filterChanged('pageSize',String(size));
      const request=http.expectOne(r=>r.params.get('pageSize')===String(size));
      expect(request.request.params.get('page')).toBe('1');
      request.flush({data:{items:[],total:0,page:1,pageSize:size,totalPages:0}});
    }
  });
});
