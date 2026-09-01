import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app-config';
import { LayoutService } from '../../core/services/layout.service';
import { HeaderComponent } from '../header/header.component';
import { LoadingBarComponent } from '../loading-bar/loading-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastHostComponent } from '../toast-host/toast-host.component';

/** AdminLTE application shell: header, plugin-driven sidebar, routed content. */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    LoadingBarComponent,
    ToastHostComponent,
  ],
  host: { class: 'app-wrapper' },
  template: `
    <app-loading-bar />
    <app-header />
    <app-sidebar />

    @if (layout.isMobile() && layout.sidebarMobileOpen()) {
      <div class="sidebar-overlay" (click)="layout.closeMobileSidebar()"></div>
    }

    <main class="app-main">
      <div class="app-content pt-3">
        <div class="container-fluid">
          <router-outlet />
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <div class="float-end d-none d-sm-inline">Angular {{ angularVersion }} · AdminLTE 4</div>
      <strong>&copy; {{ year }} YCompany.</strong> {{ config.appName }} — Retail Inventory
      Management Software System.
    </footer>

    <app-toast-host />
  `,
  styles: `
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      z-index: 1037;
      background: rgba(0, 0, 0, 0.45);
    }
  `,
})
export class ShellComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly config = inject(APP_CONFIG);
  protected readonly year = new Date().getFullYear();
  protected readonly angularVersion = '22';
}
