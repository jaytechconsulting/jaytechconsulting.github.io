import {Component,ElementRef,computed,inject,input,output,signal} from '@angular/core';
import {Icon,ICON_PATHS,IconName} from '../../data-display/icon/icon';
import {OverlayScroll} from '../../behaviors/overlay-scroll';
@Component({selector:'app-icon-picker',imports:[Icon,OverlayScroll],templateUrl:'./icon-picker.html',styleUrl:'./icon-picker.css'})
export class IconPicker {
 readonly value=input('shield');readonly disabled=input(false);readonly options=input<string[]>(Object.keys(ICON_PATHS));readonly error=input('');readonly valueChange=output<string>();readonly query=signal('');
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
 readonly filtered=computed(()=>{const query=this.query().trim().toLowerCase();return this.options().filter((key):key is IconName=>Object.hasOwn(ICON_PATHS,key)).filter(key=>this.label(key).toLowerCase().includes(query)||key.toLowerCase().includes(query));});
 private readonly labels:Record<string,string>={shield:'Seguridad',user:'Usuario',dashboard:'Panel',folder:'Carpeta',ticket:'Soporte',view:'Ver',trash:'Eliminar',edit:'Editar',check:'Confirmar',plus:'Agregar',minus:'Reducir',close:'Cerrar',logout:'Salir',warning:'Advertencia',question:'Pregunta',info:'Información',filter:'Filtros',eraser:'Limpiar',reset:'Actualizar',sort:'Ordenar',search:'Buscar',chevronDown:'Desplegar',chevronLeft:'Anterior',chevronRight:'Siguiente',first:'Primero',last:'Último',sortAscending:'Orden ascendente',sortDescending:'Orden descendente',arrowUp:'Subir',arrowDown:'Bajar',cmssecciones:'Secciones web',cmsempresas:'Empresas',cmsresenas:'Reseñas',cmsservicios:'Servicios',cmsproyectos:'Portafolio',cmsplanes:'Planes',cmsanuncio:'Anuncios',cmspaginas:'Páginas',cmsprogramas:'Programas',cmscarga:'Carga',cmsheader:'Cabecera',cmsfooter:'Pie de página'};
 label(key:string):string{return this.labels[key] || key.replace(/^cms/,'').replace(/([a-z])([A-Z])/g,'$1 $2');}
 choose(key:string):void{if(!this.disabled() && this.options().includes(key) && Object.hasOwn(ICON_PATHS,key))this.valueChange.emit(key);}
 keydown(event:KeyboardEvent,index:number):void{
  if(this.disabled() || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
  event.preventDefault();const options=this.filtered();const next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+options.length)%options.length;
  if(!options[next])return;this.choose(options[next]);
  const buttons=this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role=radio]');const button=buttons[next];button?.focus({preventScroll:true});const grid=this.host.nativeElement.querySelector<HTMLElement>('.icon-grid');if(!grid||!button)return;
  const area=grid.getBoundingClientRect(),item=button.getBoundingClientRect();if(item.top<area.top)grid.scrollTop+=item.top-area.top;else if(item.bottom>area.bottom)grid.scrollTop+=item.bottom-area.bottom;
 }
}
