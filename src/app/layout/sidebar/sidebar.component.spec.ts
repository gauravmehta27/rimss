import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app-config';
import { PluginRegistryService } from '../../core/plugin/plugin-registry.service';
import { LayoutService } from '../../core/services/layout.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  const closeMobileSidebar = vi.fn();

  beforeEach(() => {
    closeMobileSidebar.mockClear();
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([{ path: 'home', children: [] }]),
        { provide: APP_CONFIG, useValue: environment },
        { provide: LayoutService, useValue: { closeMobileSidebar } },
        {
          provide: PluginRegistryService,
          useValue: {
            activePlugins: () => [{ id: 'home' }],
            navGroups: () => [
              {
                name: 'Storefront',
                items: [{ id: 'home', title: 'Home', route: '/home', icon: 'bi-house' }],
              },
            ],
          },
        },
      ],
    });
  });

  it('retains native list semantics inside a named navigation landmark', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    const list = nav.querySelector('ul')!;
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');
    expect(list.hasAttribute('role')).toBe(false);
    expect(list.querySelectorAll(':scope > li')).toHaveLength(2);
    expect(nav.querySelector('[role="menu"]')).toBeNull();
  });

  it('announces the current page and closes mobile navigation on selection', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/home');
    await fixture.whenStable();
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.nav-link');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
    link.click();
    expect(closeMobileSidebar).toHaveBeenCalledOnce();
    await fixture.whenStable();
  });
});
