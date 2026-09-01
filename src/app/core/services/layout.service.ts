import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'rimss.theme';
const SIDEBAR_KEY = 'rimss.sidebar.collapsed';
const MOBILE_BREAKPOINT = 992; // matches AdminLTE `sidebar-expand-lg`

/**
 * Owns the AdminLTE shell state (sidebar + colour scheme) and mirrors it onto
 * the document. Keeping DOM class juggling in one service means components stay
 * declarative and the layout can be driven from tests.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly document = inject(DOCUMENT);

  private readonly collapsed = signal(readBool(SIDEBAR_KEY, false));
  private readonly mobileOpen = signal(false);
  private readonly theme = signal<ThemeMode>(readTheme());
  private readonly viewportWidth = signal(this.document.defaultView?.innerWidth ?? 1280);

  readonly sidebarCollapsed = this.collapsed.asReadonly();
  readonly sidebarMobileOpen = this.mobileOpen.asReadonly();
  readonly themeMode = this.theme.asReadonly();
  readonly isMobile = computed(() => this.viewportWidth() < MOBILE_BREAKPOINT);
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    const view = this.document.defaultView;
    view?.addEventListener('resize', () => this.viewportWidth.set(view.innerWidth), {
      passive: true,
    });

    effect(() => {
      const body = this.document.body;
      body.classList.toggle('sidebar-collapse', this.collapsed() && !this.isMobile());
      body.classList.toggle('sidebar-open', this.mobileOpen() && this.isMobile());
      body.classList.toggle('sidebar-is-hovered', false);
    });

    effect(() => {
      const mode = this.theme();
      this.document.documentElement.setAttribute('data-bs-theme', mode);
      writeStorage(THEME_KEY, mode);
    });

    effect(() => writeStorage(SIDEBAR_KEY, String(this.collapsed())));
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileOpen.update((open) => !open);
      return;
    }
    this.collapsed.update((value) => !value);
  }

  closeMobileSidebar(): void {
    this.mobileOpen.set(false);
  }

  toggleTheme(): void {
    this.theme.update((mode) => (mode === 'dark' ? 'light' : 'dark'));
  }
}

function readTheme(): ThemeMode {
  const stored = readStorage(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function readBool(key: string, fallback: boolean): boolean {
  const stored = readStorage(key);
  return stored === null ? fallback : stored === 'true';
}

function readStorage(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage?.setItem(key, value);
  } catch {
    /* preference simply does not persist */
  }
}
