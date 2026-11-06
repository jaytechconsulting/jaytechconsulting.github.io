import { Component, computed, effect, input, signal } from '@angular/core';
@Component({selector:'app-avatar',template:`@if(url() && !failed()){<img [src]="url()" alt="" referrerpolicy="no-referrer" draggable="false" [style.object-position]="x()+'% '+y()+'%'" [style.transform]="transform()" (error)="failed.set(true)"/>}@else{<span>{{initials() || 'U'}}</span>}`,styles:`:host{display:grid;place-items:center;width:100%;height:100%;overflow:hidden;border-radius:50%;background:color-mix(in srgb,var(--accent-primary) 10%,var(--surface-card));color:var(--accent-primary);isolation:isolate}img{display:block;width:100%;height:100%;object-fit:cover;user-select:none}span{font-family:var(--font-body);font-size:inherit;font-weight:750;letter-spacing:-.03em}`})
export class Avatar {
 readonly url=input<string|null>();readonly initials=input('');readonly zoom=input(1);readonly x=input(50);readonly y=input(50);readonly failed=signal(false);
 readonly transform=computed(()=>`translate(${(50-this.x())*(this.zoom()-1)}%, ${(50-this.y())*(this.zoom()-1)}%) scale(${this.zoom()})`);
 constructor(){effect(()=>{this.url();this.failed.set(false);});}
}
