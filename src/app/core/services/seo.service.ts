import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { APP_CONFIG } from '../config/app-config';

export interface PageSeo {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'product';
  canonicalPath?: string;
}

/**
 * Centralised SEO surface: titles, meta description, Open Graph, canonical link
 * and JSON-LD. Every route sets its metadata through this service so crawlers
 * always receive complete, non-duplicated tags.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(APP_CONFIG);

  apply(seo: PageSeo): void {
    const fullTitle = `${seo.title} | ${this.config.appName} — YCompany`;
    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: seo.description });
    if (seo.keywords?.length) {
      this.meta.updateTag({ name: 'keywords', content: seo.keywords.join(', ') });
    }
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:type', content: seo.type ?? 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    if (seo.image) {
      this.meta.updateTag({ property: 'og:image', content: seo.image });
    }
    this.setCanonical(seo.canonicalPath);
  }

  /** Emits structured data so products can qualify for rich results. */
  setStructuredData(id: string, data: Record<string, unknown>): void {
    const elementId = `ld-${id}`;
    this.document.getElementById(elementId)?.remove();

    const script = this.document.createElement('script');
    script.id = elementId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private setCanonical(path?: string): void {
    const href = path
      ? new URL(path, this.document.location.origin).toString()
      : this.document.location.href.split('?')[0];

    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
