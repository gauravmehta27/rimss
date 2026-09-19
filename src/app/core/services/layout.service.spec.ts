import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
    document.documentElement.removeAttribute('data-bs-theme');
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
  });

  it('starts expanded on desktop and collapses on toggle', () => {
    const service = TestBed.inject(LayoutService);
    expect(service.isMobile()).toBe(false);
    expect(service.sidebarCollapsed()).toBe(false);

    service.toggleSidebar();
    TestBed.inject(ApplicationRef).tick();
    expect(service.sidebarCollapsed()).toBe(true);
    expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
  });

  it('toggles the mobile drawer instead of the desktop state under the breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    window.dispatchEvent(new Event('resize'));
    const service = TestBed.inject(LayoutService);

    service.toggleSidebar();
    expect(service.sidebarMobileOpen()).toBe(true);
    expect(service.sidebarCollapsed()).toBe(false);

    service.closeMobileSidebar();
    expect(service.sidebarMobileOpen()).toBe(false);
  });

  it('persists the sidebar preference to storage', () => {
    const service = TestBed.inject(LayoutService);
    service.toggleSidebar();
    TestBed.inject(ApplicationRef).tick();
    expect(localStorage.getItem('rimms.sidebar.collapsed')).toBe('true');
  });

  it('toggles the theme and mirrors it onto the document', () => {
    const service = TestBed.inject(LayoutService);
    const initial = service.themeMode();
    service.toggleTheme();
    TestBed.inject(ApplicationRef).tick();

    expect(service.themeMode()).not.toBe(initial);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe(service.themeMode());
    expect(localStorage.getItem('rimms.theme')).toBe(service.themeMode());
  });

  it('reacts to viewport resize for isMobile', () => {
    const service = TestBed.inject(LayoutService);
    expect(service.isMobile()).toBe(false);

    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    window.dispatchEvent(new Event('resize'));

    expect(service.isMobile()).toBe(true);
  });
});
