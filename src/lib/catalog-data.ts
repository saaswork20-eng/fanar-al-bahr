import { encryptDigitalKey } from './crypto-vault';

export interface StoredCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoredPlatform {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
}

export interface StoredProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  coverImageUrl: string;
  bannerImageUrl: string | null;
  images?: string[];
  categoryId: string;
  categoryName?: string;
  platformId?: string | null;
  platformName?: string;
  region: string;
  price: number;
  discountPrice?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  stockQuantity: number;
  stock?: number;
  lowStockThreshold?: number;
  sku?: string | null;
  deliveryType: 'INSTANT_KEY' | 'ACCOUNT_SERVICE' | 'GIFT_LINK' | 'PHYSICAL_SHIPPING';
  status?: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'OUT_OF_STOCK';
  isPublished?: boolean;
  isActive: boolean;
  isFeatured?: boolean;
  brand?: string | null;
  developer?: string | null;
  publisher?: string | null;
  releaseYear?: number;
  specifications?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredProductKey {
  id: string;
  productId: string;
  cipherText: string;
  iv: string;
  tag: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'REVOKED';
  orderItemId?: string | null;
  isRevealed: boolean;
  revealedAt: string | null;
  createdAt: string;
}

export const INITIAL_CATEGORIES: StoredCategory[] = [
  {
    id: 'cat_games',
    name: 'Video Games',
    slug: 'video-games',
    description: 'PC and console digital game keys with instant activation.',
  },
  {
    id: 'cat_software',
    name: 'Software & OS',
    slug: 'software-os',
    description: 'Genuine operating system licenses and productivity software.',
  },
  {
    id: 'cat_subscriptions',
    name: 'Subscriptions & Gift Cards',
    slug: 'subscriptions-gift-cards',
    description: 'Prepaid gaming store credit, memberships, and digital vouchers.',
  },
];

export const INITIAL_PLATFORMS: StoredPlatform[] = [
  { id: 'plat_pc', name: 'PC', slug: 'pc', iconUrl: '/icons/pc.svg' },
  { id: 'plat_steam', name: 'Steam', slug: 'steam', iconUrl: '/icons/steam.svg' },
  { id: 'plat_ea', name: 'EA App', slug: 'ea-app', iconUrl: '/icons/ea.svg' },
  { id: 'plat_xbox', name: 'Xbox Series X/S', slug: 'xbox', iconUrl: '/icons/xbox.svg' },
  { id: 'plat_ps5', name: 'PlayStation 5', slug: 'ps5', iconUrl: '/icons/ps5.svg' },
  { id: 'plat_epic', name: 'Epic Games', slug: 'epic-games', iconUrl: '/icons/epic.svg' },
];

export const INITIAL_PRODUCTS: StoredProduct[] = [
  {
    id: 'prod_001',
    title: 'EA SPORTS FC 26 — Standard Edition',
    slug: 'ea-sports-fc-26-standard-edition-pc-ea-app-global',
    description:
      'Experience the next evolution of the worlds game with HyperMotionV technology, refreshed Career Mode, and cross-play Ultimate Team. Direct from Fanar Al Bhar with instant digital key dispatch.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_ea',
    platformName: 'EA App',
    region: 'GLOBAL',
    price: 3850,
    discountPrice: 4999,
    stockQuantity: 25,
    sku: 'FAB-EAFC-26',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: true,
    brand: 'EA Sports',
    developer: 'EA Vancouver & EA Romania',
    publisher: 'Electronic Arts',
    releaseYear: 2026,
    coverImageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_002',
    title: 'Grand Theft Auto V: Premium Edition',
    slug: 'grand-theft-auto-v-premium-edition-pc-steam-global',
    description:
      'Grand Theft Auto V: Premium Edition includes the complete GTAV story experience, Grand Theft Auto Online, and all existing gameplay upgrades and content.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_steam',
    platformName: 'Steam',
    region: 'GLOBAL',
    price: 999,
    discountPrice: 2499,
    stockQuantity: 40,
    sku: 'FAB-GTAV-PREM',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: true,
    brand: 'Rockstar Games',
    developer: 'Rockstar North',
    publisher: 'Rockstar Games',
    releaseYear: 2023,
    coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_003',
    title: 'Cyberpunk 2077: Phantom Liberty Bundle',
    slug: 'cyberpunk-2077-phantom-liberty-bundle-pc-steam',
    description:
      'Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City. Phantom Liberty is a spy-thriller adventure expansion featuring Solomon Reed.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_steam',
    platformName: 'Steam',
    region: 'GLOBAL',
    price: 2799,
    discountPrice: 3599,
    stockQuantity: 18,
    sku: 'FAB-CP77-PL',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: true,
    brand: 'CD PROJEKT RED',
    developer: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    releaseYear: 2023,
    coverImageUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_004',
    title: 'Elden Ring — Shadow of the Erdtree Edition',
    slug: 'elden-ring-shadow-of-the-erdtree-edition-pc-steam',
    description:
      'Winner of hundreds of accolades including The Game Awards Game of the Year. Guided by Empyrean Miquella, players are summoned to the Land of Shadow.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_steam',
    platformName: 'Steam',
    region: 'GLOBAL',
    price: 3450,
    discountPrice: 4299,
    stockQuantity: 15,
    sku: 'FAB-ER-SOTE',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: true,
    brand: 'Bandai Namco',
    developer: 'FromSoftware Inc.',
    publisher: 'Bandai Namco Entertainment',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_005',
    title: 'Red Dead Redemption 2 — Ultimate Edition',
    slug: 'red-dead-redemption-2-ultimate-edition-pc-steam',
    description:
      'Winner of over 175 Game of the Year Awards, RDR2 is an epic tale of honor and loyalty at the dawn of the modern age.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_steam',
    platformName: 'Steam',
    region: 'GLOBAL',
    price: 1799,
    discountPrice: 3999,
    stockQuantity: 22,
    sku: 'FAB-RDR2-ULT',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: false,
    brand: 'Rockstar Games',
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    releaseYear: 2019,
    coverImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_006',
    title: 'Call of Duty: Black Ops 6 — Cross-Gen Bundle',
    slug: 'call-of-duty-black-ops-6-cross-gen-xbox-global',
    description:
      'Black Ops 6 delivers signature action across a cinematic Campaign, Multiplayer, and the return of Round-Based Zombies.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_xbox',
    platformName: 'Xbox Series X/S',
    region: 'GLOBAL',
    price: 4499,
    discountPrice: 5599,
    stockQuantity: 12,
    sku: 'FAB-COD-BO6',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: false,
    brand: 'Activision',
    developer: 'Treyarch, Raven Software',
    publisher: 'Activision',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_007',
    title: "Marvel's Spider-Man 2",
    slug: 'marvels-spider-man-2-ps5-digital-code',
    description:
      'Spider-Men Peter Parker and Miles Morales return for an exciting new adventure in the critically acclaimed Marvel franchise for PS5.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_ps5',
    platformName: 'PlayStation 5',
    region: 'GLOBAL',
    price: 3899,
    discountPrice: 4999,
    stockQuantity: 14,
    sku: 'FAB-SM2-PS5',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: false,
    brand: 'PlayStation Studios',
    developer: 'Insomniac Games',
    publisher: 'PlayStation Studios',
    releaseYear: 2023,
    coverImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_008',
    title: 'God of War Ragnarök',
    slug: 'god-of-war-ragnarok-pc-steam-global',
    description:
      'Join Kratos and Atreus on a mythic journey for answers before Ragnarök arrives in this acclaimed Norse action-adventure masterpiece.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_steam',
    platformName: 'Steam',
    region: 'GLOBAL',
    price: 2950,
    discountPrice: 3999,
    stockQuantity: 16,
    sku: 'FAB-GOW-RAG',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: false,
    brand: 'PlayStation PC',
    developer: 'Santa Monica Studio',
    publisher: 'PlayStation PC LLC',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_009',
    title: 'Windows 11 Professional — Lifetime License OEM',
    slug: 'windows-11-professional-lifetime-license-oem-pc',
    description:
      'Instant digital activation key for 1 PC. Includes BitLocker encryption, Remote Desktop, Windows Sandbox, and enterprise security tools.',
    categoryId: 'cat_software',
    categoryName: 'Software & OS',
    platformId: 'plat_pc',
    platformName: 'PC',
    region: 'GLOBAL',
    price: 1399,
    discountPrice: 9999,
    stockQuantity: 65,
    sku: 'FAB-WIN11-PRO',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: true,
    brand: 'Microsoft',
    developer: 'Microsoft Corporation',
    publisher: 'Microsoft Corporation',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_010',
    title: 'Microsoft Office 2024 Pro Plus — 1 PC License',
    slug: 'microsoft-office-2024-pro-plus-1-pc-license',
    description:
      'Complete desktop productivity suite: Word, Excel, PowerPoint, Outlook, Access, and Publisher. One-time perpetual license with lifetime activation.',
    categoryId: 'cat_software',
    categoryName: 'Software & OS',
    platformId: 'plat_pc',
    platformName: 'PC',
    region: 'GLOBAL',
    price: 2199,
    discountPrice: 14999,
    stockQuantity: 30,
    sku: 'FAB-OFF24-PRO',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: false,
    brand: 'Microsoft',
    developer: 'Microsoft Corporation',
    publisher: 'Microsoft Corporation',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_011',
    title: 'Xbox Game Pass Ultimate — 3 Month Subscription',
    slug: 'xbox-game-pass-ultimate-3-month-subscription-global',
    description:
      'Play hundreds of high-quality games with friends across console, PC, and cloud. Includes EA Play membership and exclusive member discounts.',
    categoryId: 'cat_subscriptions',
    categoryName: 'Subscriptions & Gift Cards',
    platformId: 'plat_xbox',
    platformName: 'Xbox Series X/S',
    region: 'GLOBAL',
    price: 1850,
    discountPrice: 2499,
    stockQuantity: 35,
    sku: 'FAB-XGPU-3M',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: true,
    brand: 'Xbox',
    developer: 'Microsoft Gaming',
    publisher: 'Microsoft Gaming',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_012',
    title: 'Steam Wallet Gift Card ₹1000 INR Code',
    slug: 'steam-wallet-gift-card-1000-inr-code-india',
    description:
      'Add ₹1,000 credit instantly to any Indian Steam Wallet balance. Redeemable for thousands of PC games, downloadable content, and community items.',
    categoryId: 'cat_subscriptions',
    categoryName: 'Subscriptions & Gift Cards',
    platformId: 'plat_steam',
    platformName: 'Steam',
    region: 'INDIA',
    price: 975,
    discountPrice: 1000,
    stockQuantity: 50,
    sku: 'FAB-STEAM-1000',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: true,
    brand: 'Steam',
    developer: 'Valve Corporation',
    publisher: 'Valve Corporation',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1612287233207-695022875f1a?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_013',
    title: 'PlayStation Network Card ₹2000 INR Voucher',
    slug: 'playstation-network-card-2000-inr-voucher-india',
    description:
      'Instantly fund your PlayStation Store wallet for PS5 and PS4 games, add-ons, subscriptions, and seasonal battle passes.',
    categoryId: 'cat_subscriptions',
    categoryName: 'Subscriptions & Gift Cards',
    platformId: 'plat_ps5',
    platformName: 'PlayStation 5',
    region: 'INDIA',
    price: 1950,
    discountPrice: 2000,
    stockQuantity: 20,
    sku: 'FAB-PSN-2000',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: false,
    brand: 'PlayStation',
    developer: 'Sony Interactive Entertainment',
    publisher: 'Sony Interactive Entertainment',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'prod_014',
    title: 'HELLDIVERS 2 — Super Citizen Edition',
    slug: 'helldivers-2-super-citizen-edition-pc-steam',
    description:
      'Enlist in the Helldivers and join the fight for freedom across a hostile galaxy in a fast, frantic third-person cooperative shooter.',
    categoryId: 'cat_games',
    categoryName: 'Video Games',
    platformId: 'plat_steam',
    platformName: 'Steam',
    region: 'GLOBAL',
    price: 2899,
    discountPrice: 3499,
    stockQuantity: 10,
    sku: 'FAB-HD2-SUPER',
    deliveryType: 'INSTANT_KEY',
    isActive: true,
    isFeatured: false,
    brand: 'PlayStation PC',
    developer: 'Arrowhead Game Studios',
    publisher: 'PlayStation Publishing LLC',
    releaseYear: 2024,
    coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    bannerImageUrl: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
];

// Helper to generate initial encrypted digital keys linked directly to products
function createInitialKeys(): StoredProductKey[] {
  const keys: StoredProductKey[] = [];
  const sampleCodes = [
    'FC26-7KM9-WY42-NX88',
    'FC26-9BL2-KQ84-VT31',
    'GTA5-88NM-TY72-PL09',
    'CYBER-42P9-M88X-ZA11',
    'ELDEN-90KL-TR55-WW21',
    'WIN11-VK7JG-NPHTM-C97JM-9MPGT',
    'STEAM-1000-8H99-XZ33-TR12',
  ];

  INITIAL_PRODUCTS.forEach((prod, pIdx) => {
    sampleCodes.forEach((code, codeIdx) => {
      const encrypted = encryptDigitalKey(`${code}-FAB-${pIdx}`);
      keys.push({
        id: `key_${pIdx}_${codeIdx}`,
        productId: prod.id,
        cipherText: encrypted.cipherText,
        iv: encrypted.iv,
        tag: encrypted.tag,
        status: codeIdx === 0 ? 'SOLD' : 'AVAILABLE',
        isRevealed: codeIdx === 0,
        revealedAt: codeIdx === 0 ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      });
    });
  });

  return keys;
}

export const INITIAL_KEYS: StoredProductKey[] = createInitialKeys();
