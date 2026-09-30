import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { formatPublicProduct } from '@/lib/product-helper';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import ProductDetailsClient from '@/components/storefront/ProductDetailsClient';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
  });

  if (!product || (!product.status || product.status !== 'PUBLISHED') || !product.isActive) {
    return {
      title: 'Product Not Found — FANAR AL BHAR',
      description: 'The requested product is unavailable or does not exist.',
    };
  }

  const title = `${product.title} — FANAR AL BHAR Official Digital Store`;
  const description =
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    'Instant digital activation key direct from Fanar Al Bhar.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: product.coverImageUrl,
          width: 800,
          height: 500,
          alt: product.title,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const rawProduct = await db.product.findUnique({
    where: { slug },
  });

  // Strict public storefront gate: MUST be PUBLISHED and active
  if (!rawProduct || (rawProduct.status && rawProduct.status !== 'PUBLISHED') || !rawProduct.isActive) {
    notFound();
  }

  // Format public product payload (stripping keys, secrets, etc.)
  const publicProduct = formatPublicProduct(rawProduct);

  // Fetch related active products in the same category
  const rawRelated = await db.product.findMany({
    where: {
      categoryId: rawProduct.categoryId,
      status: 'PUBLISHED',
      isActive: true,
    },
    take: 5,
  });

  const relatedProducts = rawRelated
    .filter((p) => p.id !== rawProduct.id && (!p.status || p.status === 'PUBLISHED') && p.isActive)
    .slice(0, 4)
    .map(formatPublicProduct);

  const siteUrl = process.env.NEXTAUTH_URL || 'https://fanaralbhar.com';
  const productPrice = Number(rawProduct.discountPrice ?? rawProduct.price);
  const inStock = (rawProduct.stockQuantity ?? 0) > 0;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: rawProduct.title,
    image: rawProduct.coverImageUrl ? [rawProduct.coverImageUrl] : [],
    description: rawProduct.description || rawProduct.shortDescription || rawProduct.title,
    sku: rawProduct.sku || undefined,
    brand: {
      '@type': 'Brand',
      name: rawProduct.brand || 'Fanar Al Bhar',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/product/${rawProduct.slug}`,
      priceCurrency: 'INR',
      price: productPrice,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Fanar Al Bhar',
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${siteUrl}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: rawProduct.title,
        item: `${siteUrl}/product/${rawProduct.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <StorefrontHeader />
      <main className="flex-1">
        <ProductDetailsClient
          product={publicProduct as any}
          relatedProducts={relatedProducts}
        />
      </main>
      <StorefrontFooter />
    </div>
  );
}
