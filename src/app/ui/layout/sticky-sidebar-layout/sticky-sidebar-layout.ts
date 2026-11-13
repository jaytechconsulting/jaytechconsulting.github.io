import { Component, input } from '@angular/core';

@Component({
  selector: 'app-sticky-sidebar-layout',
  template: `
    <div
      class="layout"
      [class.single-column]="!showSidebar()"
      [class.wide-sidebar]="stackEarlier()"
    >
      <div class="sidebar" [hidden]="!showSidebar()"><ng-content select="[layoutSidebar]" /></div>
      <div class="content"><ng-content /></div>
    </div>
  `,
  styleUrl: './sticky-sidebar-layout.css',
})
export class StickySidebarLayout {
  readonly showSidebar = input(true);
  readonly stackEarlier = input(false);
}
