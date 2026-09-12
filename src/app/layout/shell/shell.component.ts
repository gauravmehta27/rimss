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
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly config = inject(APP_CONFIG);
  protected readonly year = new Date().getFullYear();
}
