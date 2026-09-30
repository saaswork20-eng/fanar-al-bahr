import { StoredProduct } from './catalog-data';
export { formatINR } from './utils';

export interface CalculatedPricing {
  regularPrice: number;
  salePrice: number | null;
  currentPrice: number;
  discountPercent: number;
  isOnSale: boolean;
  isSaleActive: boolean;
  salePeriodText?: string | null;
}

/**
 * Single-vendor canonical price calculation.
 * Ensures the server and UI stay 100% in sync regarding regular vs sale price,
 * discount percentage, and active discount date windows.
 */
export function calculateProductPricing(product: {
  price: number;
  discountPrice?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
}): CalculatedPricing {
  const now = new Date();

  // Check date bounds if provided
  let isDateValid = true;
  if (product.discountStartDate) {
    const start = new Date(product.discountStartDate);
    if (!isNaN(start.getTime()) && now < start) isDateValid = false;
  }
  if (product.discountEndDate) {
    const end = new Date(product.discountEndDate);
    if (!isNaN(end.getTime()) && now > end) isDateValid = false;
  }

  const rawPrice = Number(product.price) || 0;
  const rawDiscount =
    product.discountPrice !== undefined && product.discountPrice !== null
      ? Number(product.discountPrice)
      : null;

  if (rawDiscount !== null && rawDiscount > 0 && isDateValid) {
    if (rawDiscount < rawPrice) {
      // Standard single-vendor model: price = regularPrice, discountPrice = salePrice
      const regularPrice = rawPrice;
      const salePrice = rawDiscount;
      const discountPercent = Math.max(1, Math.round(((regularPrice - salePrice) / regularPrice) * 100));
      return {
        regularPrice,
        salePrice,
        currentPrice: salePrice,
        discountPercent,
        isOnSale: true,
        isSaleActive: true,
      };
    } else if (rawDiscount > rawPrice) {
      // Legacy seed model: discountPrice = MSRP/retail, price = selling price
      const regularPrice = rawDiscount;
      const salePrice = rawPrice;
      const discountPercent = Math.max(1, Math.round(((regularPrice - salePrice) / regularPrice) * 100));
      return {
        regularPrice,
        salePrice,
        currentPrice: salePrice,
        discountPercent,
        isOnSale: true,
        isSaleActive: true,
      };
    }
  }

  // Not on active sale
  return {
    regularPrice: rawPrice,
    salePrice: null,
    currentPrice: rawPrice,
    discountPercent: 0,
    isOnSale: false,
    isSaleActive: false,
  };
}

export type StockStatusType = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function getStockStatus(product: {
  stockQuantity: number;
  lowStockThreshold?: number | null;
}): {
  status: StockStatusType;
  label: string;
  badgeColor: string;
} {
  const stock = Number(product.stockQuantity) || 0;
  const threshold = product.lowStockThreshold ?? 5;

  if (stock <= 0) {
    return {
      status: 'OUT_OF_STOCK',
      label: 'Out of Stock',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };
  }
  if (stock <= threshold) {
    return {
      status: 'LOW_STOCK',
      label: `Low Stock (${stock} left)`,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    };
  }
  return {
    status: 'IN_STOCK',
    label: 'In Stock',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };
}

/**
 * Sanitize public product payload: strips internal secrets, keys, and metadata.
 */
export function formatPublicProduct(product: StoredProduct) {
  const pricing = calculateProductPricing(product);
  const stock = getStockStatus(product);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription || null,
    coverImageUrl: product.coverImageUrl,
    bannerImageUrl: product.bannerImageUrl || null,
    images: product.images && product.images.length > 0 ? product.images : [product.coverImageUrl],
    categoryId: product.categoryId,
    categoryName: product.categoryName || 'General',
    platformId: product.platformId || null,
    platformName: product.platformName || 'Multi-Platform',
    region: product.region || 'GLOBAL',
    price: product.price,
    discountPrice: product.discountPrice ?? null,
    discountStartDate: product.discountStartDate ?? null,
    discountEndDate: product.discountEndDate ?? null,
    regularPrice: pricing.regularPrice,
    salePrice: pricing.salePrice,
    currentPrice: pricing.currentPrice,
    discountPercent: pricing.discountPercent,
    isOnSale: pricing.isOnSale,
    isSaleActive: pricing.isSaleActive,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    inStock: product.stockQuantity > 0,
    stockStatus: stock.status,
    stockLabel: stock.label,
    sku: product.sku || null,
    deliveryType: product.deliveryType,
    brand: product.brand || null,
    developer: product.developer || null,
    publisher: product.publisher || null,
    releaseYear: product.releaseYear || null,
    specifications: product.specifications || null,
    weight: product.weight || null,
    dimensions: product.dimensions || null,
    isFeatured: !!product.isFeatured,
    status: product.status || 'PUBLISHED',
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
