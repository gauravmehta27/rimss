import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app-config';
import { PluginRegistryService } from '../../core/plugin/plugin-registry.service';
import { LayoutService } from '../../core/services/layout.service';

/**
 * Sidebar navigation rendered entirely from the plugin registry — mounting a
 * module automatically publishes its entry here.
 *
 * AdminLTE places `.app-sidebar` in a named CSS grid area, so the class lives on
 * the component host instead of a wrapper element inside the template.
 */
@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'app-sidebar bg-body-secondary shadow', 'data-bs-theme': 'dark' },
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly registry = inject(PluginRegistryService);
  protected readonly layout = inject(LayoutService);
  protected readonly config = inject(APP_CONFIG);
}
