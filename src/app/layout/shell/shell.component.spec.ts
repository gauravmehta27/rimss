import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app-config';
import { LayoutService } from '../../core/services/layout.service';
import { PluginRegistryService } from '../../core/plugin/plugin-registry.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: APP_CONFIG, useValue: environment },
        {
          provide: PluginRegistryService,
          useValue: { activePlugins: () => [], navGroups: () => [] },
        },
      ],
    });
  });

  it('renders the header, sidebar, router outlet and toast host', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement;

    expect(element.querySelector('app-header')).not.toBeNull();
    expect(element.querySelector('app-sidebar')).not.toBeNull();
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('app-toast-host')).not.toBeNull();
  });

  it('only shows the mobile overlay when the sidebar is open on a small viewport', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar-overlay')).toBeNull();

    const layout = TestBed.inject(LayoutService);
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    window.dispatchEvent(new Event('resize'));
    layout.toggleSidebar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-overlay')).not.toBeNull();
  });

  it('closes the mobile sidebar when the overlay is clicked', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    const layout = TestBed.inject(LayoutService);
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    window.dispatchEvent(new Event('resize'));
    layout.toggleSidebar();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.sidebar-overlay').click();
    fixture.detectChanges();

    expect(layout.sidebarMobileOpen()).toBe(false);
  });
});
