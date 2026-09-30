export type PlatformType = 'PC' | 'PlayStation 5' | 'Xbox Series X/S' | 'Nintendo Switch' | 'Epic Games' | 'Steam' | 'EA App';

export interface SingleVendorProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  platform: PlatformType;
  region: 'GLOBAL' | 'EUROPE' | 'ASIA' | 'NORTH_AMERICA';
  coverImageUrl: string;
  bannerImageUrl: string;
  releaseYear: number;
  developer: string;
  publisher: string;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  sku: string;
  deliveryType: 'INSTANT_DIGITAL_KEY' | 'ACCOUNT_SERVICE' | 'GIFT_LINK';
  warrantyDays: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface EncryptedKeyRecord {
  id: string;
  productId: string;
  maskedKey: string;
  cipherText: string;
  iv: string;
  tag: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  isRevealed: boolean;
  decryptedValue?: string;
}

