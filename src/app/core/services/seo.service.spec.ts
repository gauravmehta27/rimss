import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;

  beforeEach(() => {
    document.head
      .querySelectorAll('link[rel="canonical"], script[id^="ld-"]')
      .forEach((el) => el.remove());
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: environment }],
    });
    service = TestBed.inject(SeoService);
  });

  it('sets the page title suffixed with the app and brand name', () => {
    service.apply({ title: 'Your bag', description: 'Review your bag.' });
    expect(TestBed.inject(Title).getTitle()).toBe('Your bag | RIMSS — YCompany');
  });

  it('publishes description, keywords and open graph tags', () => {
    service.apply({
      title: 'Shop',
      description: 'Browse the collection.',
      keywords: ['sweaters', 'corduroy'],
      image: 'https://example.com/hero.jpg',
    });
    const meta = TestBed.inject(Meta);

    expect(meta.getTag('name="description"')?.content).toBe('Browse the collection.');
    expect(meta.getTag('name="keywords"')?.content).toBe('sweaters, corduroy');
    expect(meta.getTag('property="og:title"')?.content).toBe('Shop | RIMSS — YCompany');
    expect(meta.getTag('property="og:image"')?.content).toBe('https://example.com/hero.jpg');
  });

  it('writes an absolute canonical link from a relative path', () => {
    service.apply({ title: 'Home', description: 'Welcome', canonicalPath: '/home' });
    const link = document.querySelector('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe(`${document.location.origin}/home`);
  });

  it('reuses a single canonical link element across calls', () => {
    service.apply({ title: 'Home', description: 'Welcome', canonicalPath: '/home' });
    service.apply({ title: 'Shop', description: 'Browse', canonicalPath: '/catalog' });
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it('replaces an existing structured-data script for the same id', () => {
    service.setStructuredData('product', { '@type': 'Product', name: 'Jumper' });
    service.setStructuredData('product', { '@type': 'Product', name: 'Coat' });

    const scripts = document.querySelectorAll('script#ld-product');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].textContent).toContain('Coat');
  });
});
