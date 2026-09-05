import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import type { Offer, ProductSummary } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { CardSkeletonComponent } from '../../shared/components/card-skeleton.component';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { productImage } from '../../shared/utils/product-artwork';

interface CategoryTile {
  id: string;
  name: string;
  blurb: string;
  icon: string;
}

interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  code: string | null;
  cta: string;
  background: string;
  queryParams: Record<string, string>;
}

const SLIDE_INTERVAL_MS = 6000;

const backdrop = (image: string) =>
  `linear-gradient(100deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.72) 45%, rgba(15, 23, 42, 0.25) 100%), url('${image}')`;

const WELCOME_SLIDE: HeroSlide = {
  id: 'welcome',
  eyebrow: 'Autumn / Winter 2026',
  title: 'Heritage tailoring, reimagined for every screen.',
  subtitle:
    'Sweaters, moleskin, corduroy and tattersall shirts — crafted by YCompany for the modern countryside wardrobe.',
  code: null,
  cta: 'Shop new arrivals',
  background: backdrop(productImage(1, 'outerwear', 1200, 600)),
  queryParams: { sort: 'newest' },
};

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCardComponent, CardSkeletonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly products = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly notifications = inject(NotificationService);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly featured = signal<ProductSummary[]>([]);
  protected readonly offers = signal<Offer[]>([]);
  protected readonly loading = signal(true);
  protected readonly paused = signal(false);
  protected readonly current = signal(0);

  protected readonly slides = computed<HeroSlide[]>(() => [
    WELCOME_SLIDE,
    ...this.offers().map((offer, index) => ({
      id: offer.id,
      eyebrow: `Save ${offer.discountPercent}% · until ${new Date(offer.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      title: offer.title,
      subtitle: offer.subtitle,
      code: offer.code,
      cta: 'Shop this offer',
      background: backdrop(productImage(index, offer.categoryId, 1200, 600)),
      queryParams: { categories: offer.categoryId, onSale: 'true' },
    })),
  ]);

  protected readonly categories: readonly CategoryTile[] = [
    { id: 'sweaters', name: 'Sweaters', blurb: 'Cable knits & lambswool', icon: 'bi-hearts' },
    { id: 'moleskin', name: 'Moleskin', blurb: 'Soft-brushed cotton', icon: 'bi-scissors' },
    { id: 'corduroy', name: 'Corduroy', blurb: 'Needlecord & jumbo cord', icon: 'bi-layers' },
    { id: 'shirts', name: 'Tattersall Shirts', blurb: 'Country checks', icon: 'bi-columns-gap' },
    { id: 'shoes', name: 'Shoes', blurb: 'Hand-finished leather', icon: 'bi-bootstrap' },
    { id: 'accessories', name: 'Accessories', blurb: 'Scarves, belts & caps', icon: 'bi-handbag' },
  ];

  constructor() {
    this.seo.apply({
      title: 'Luxury countryside fashion, online',
      description:
        'Shop YCompany sweaters, moleskin, corduroy, tattersall shirts, shoes and accessories for men, women and children.',
      keywords: [
        'YCompany',
        'luxury fashion',
        'sweaters',
        'moleskin',
        'corduroy',
        'tattersall shirts',
      ],
      canonicalPath: '/home',
    });

    forkJoin({
      featured: this.products.featured(8).pipe(catchError(() => of([]))),
      offers: this.products.offers().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed())
      .subscribe(({ featured, offers }) => {
        this.featured.set(featured);
        this.offers.set(offers);
        this.loading.set(false);
      });

    this.startAutoPlay();
  }

  protected move(delta: number): void {
    const count = this.slides().length;
    this.current.set((this.current() + delta + count) % count);
  }

  protected goTo(index: number): void {
    this.current.set(index);
  }

  /** Slides advance on their own unless the visitor is interacting or has asked for reduced motion. */
  private startAutoPlay(): void {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      if (!this.paused()) this.move(1);
    }, SLIDE_INTERVAL_MS);
    this.destroyRef.onDestroy(() => window.clearInterval(timer));
  }

  protected addToCart(product: ProductSummary): void {
    this.cart.add({
      productId: product.id,
      sku: `${product.id}-${product.sizes[0]}-${product.colors[0]}`,
      name: product.name,
      size: product.sizes[0],
      color: product.colors[0],
      price: product.price,
      quantity: 1,
      imageSeed: product.imageSeed,
      categoryId: product.categoryId,
    });
    this.notifications.success('Added to bag', product.name);
  }
}
