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
  template: `
    <div class="sidebar-brand">
      <a routerLink="/home" class="brand-link">
        <span class="brand-mark">Y</span>
        <span class="brand-text fw-semibold">{{ config.appName }}</span>
      </a>
    </div>

    <div class="sidebar-wrapper">
      <nav class="mt-2" aria-label="Main navigation">
        <ul class="nav sidebar-menu flex-column">
          @for (group of registry.navGroups(); track group.name) {
            <li class="nav-header">{{ group.name }}</li>
            @for (item of group.items; track item.id) {
              <li class="nav-item">
                <a
                  class="nav-link"
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  (click)="layout.closeMobileSidebar()"
                >
                  <i class="nav-icon bi {{ item.icon }}" aria-hidden="true"></i>
                  <p>{{ item.title }}</p>
                </a>
              </li>
            }
          }
        </ul>
      </nav>
    </div>

    <div class="sidebar-footer small px-3 py-2">
      <i class="bi bi-boxes me-1"></i>{{ registry.activePlugins().length }} modules mounted
    </div>
  `,
  styles: `
    .brand-link {
      display: flex;
      align-items: center;
      color: inherit;
      text-decoration: none;
    }
    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      margin-right: 0.6rem;
      border-radius: 0.4rem;
      background: linear-gradient(135deg, #2f4f3a, #8a9a7b);
      color: #fff;
      font-family: Georgia, serif;
      font-weight: 700;
    }
    .sidebar-wrapper {
      flex: 1 1 auto;
      overflow-x: hidden;
      overflow-y: auto;
    }
    .sidebar-footer {
      flex: 0 0 auto;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      opacity: 0.75;
    }
  `,
})
export class SidebarComponent {
  protected readonly registry = inject(PluginRegistryService);
  protected readonly layout = inject(LayoutService);
  protected readonly config = inject(APP_CONFIG);
}
