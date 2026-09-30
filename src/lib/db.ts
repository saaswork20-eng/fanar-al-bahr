import fs from 'fs';
import path from 'path';
import { PrismaClient, Role, AccountStatus, OrderStatus, DeliveryType, KeyStatus } from '@prisma/client';
import {
  StoredCategory,
  StoredPlatform,
  StoredProduct,
  StoredProductKey,
  INITIAL_CATEGORIES,
  INITIAL_PLATFORMS,
  INITIAL_PRODUCTS,
  INITIAL_KEYS,
} from './catalog-data';
import { calculateProductPricing, getStockStatus } from './product-helper';
import {
  sendOrderConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendOrderStatusUpdateEmail,
} from './email';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ---------------------------------------------------------------------------
// HYBRID PERSISTENCE STORE (SINGLE-VENDOR E-COMMERCE: FANAR AL BHAR)
// ---------------------------------------------------------------------------

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl: string | null;
  role: Role; // ADMIN or BUYER
  status: AccountStatus;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  orders?: StoredOrder[];
}

export interface StoredToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface StoredCartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCart {
  id: string;
  userId: string;
  items: StoredCartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DetailedCartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string;
    sku: string | null;
    deliveryType: string;
    categoryName?: string;
    platformName?: string;
    stockQuantity: number;
    inStock: boolean;
    stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    regularPrice: number;
    salePrice: number | null;
    currentPrice: number;
    discountPercent: number;
    isOnSale: boolean;
  };
  unitPrice: number;
  subtotal: number;
  isAvailable: boolean;
  availabilityError?: string | null;
}

export interface DetailedCart {
  id: string;
  userId: string;
  items: DetailedCartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  hasUnavailableItems: boolean;
}

export interface StoredOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  sku?: string | null;
  quantity: number;
  priceAtPurchase: number;
  subtotal?: number;
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerEmail?: string;
  buyerName?: string | null;
  subtotal?: number;
  discount?: number;
  tax?: number;
  shipping?: number;
  totalAmount: number;
  total?: number;
  buyer?: {
    id: string;
    name: string | null;
    email: string;
  };
  currency?: string;
  status: OrderStatus;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string | null;
  paymentId?: string | null;
  shippingAddress?: any;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  couponCode?: string | null;
  notes?: string | null;
  items?: StoredOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface StoredCoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  startDate: string | null;
  expiryDate: string | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string | null;
  usedAt: string;
}

export interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface StoredAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'PRODUCT' | 'ORDER' | 'USER' | 'CATEGORY' | 'COUPON' | 'SETTING';
  targetId: string;
  targetName: string | null;
  details: string | null;
  createdAt: string;
}

export interface StoredAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredWishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface StoredReview {
  id: string;
  productId: string;
  buyerId: string;
  buyerName?: string;
  orderId?: string | null;
  rating: number; // 1-5
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettingsMap {
  storeName: string;
  storeDescription: string;
  logoUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  taxRatePercent: number;
  shippingRate: number;
  freeShippingThreshold: number;
  enableGuestCheckout: boolean;
  autoApproveReviews: boolean;
  lowStockThreshold: number;
}

export const DEFAULT_SETTINGS: StoreSettingsMap = {
  storeName: 'Fanar Al Bhar',
  storeDescription: 'Premier digital software, license keys & gaming platform in India',
  logoUrl: '/images/fanar-logo.png',
  contactEmail: 'support@fanar.com',
  contactPhone: '+91 98765 43210',
  address: 'Commercial Hub, Marine Drive, Mumbai, India',
  currency: 'INR',
  taxRatePercent: 0,
  shippingRate: 99,
  freeShippingThreshold: 999,
  enableGuestCheckout: false,
  autoApproveReviews: true,
  lowStockThreshold: 10,
};

export interface DatabaseState {
  users: StoredUser[];
  passwordResetTokens: StoredToken[];
  emailVerificationTokens: StoredToken[];
  categories: StoredCategory[];
  platforms: StoredPlatform[];
  products: StoredProduct[];
  productKeys: StoredProductKey[];
  carts: StoredCart[];
  orders: StoredOrder[];
  auditLogs: StoredAuditLog[];
  addresses: StoredAddress[];
  wishlists: StoredWishlistItem[];
  reviews: StoredReview[];
  settings: StoreSettingsMap;
  coupons: StoredCoupon[];
  couponUsages: StoredCouponUsage[];
  notifications: StoredNotification[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'fanar_store.json');

const INITIAL_STATE: DatabaseState = {
  users: [
    {
      id: 'usr_admin_001',
      email: 'admin@fanar.com',
      passwordHash: '$2b$10$MEuqJicbFLzoyuLe24vFSu1GcxGgohSAQ0d6ZQxYiP6y9YUTxWG5G', // Admin@123456
      name: 'Fanar Store Administrator',
      avatarUrl: null,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      emailVerified: new Date().toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_buyer_001',
      email: 'buyer@example.com',
      passwordHash: '$2b$10$1Y8c728G9.s0.Xk7w1HhxeMekm1J3pLq8wYy.XzO7t6vWb2d.x0aG', // Buyer@123456
      name: 'Alex Mercer (Customer)',
      avatarUrl: null,
      role: Role.BUYER,
      status: AccountStatus.ACTIVE,
      emailVerified: new Date().toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  passwordResetTokens: [],
  emailVerificationTokens: [],
  categories: INITIAL_CATEGORIES,
  platforms: INITIAL_PLATFORMS,
  products: INITIAL_PRODUCTS,
  productKeys: INITIAL_KEYS,
  carts: [],
  orders: [
    {
      id: 'ord_001',
      orderNumber: 'FAB-ORD-1001',
      buyerId: 'usr_buyer_001',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Alex Mercer (Customer)',
      totalAmount: 3850.0,
      status: OrderStatus.DELIVERED,
      paymentMethod: 'UPI / CARD',
      paymentId: 'pay_live_001',
      items: [
        {
          id: 'item_001',
          orderId: 'ord_001',
          productId: 'prod_001',
          productTitle: 'EA SPORTS FC 26 — Standard Edition',
          quantity: 1,
          priceAtPurchase: 3850.0,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    },
    {
      id: 'ord_002',
      orderNumber: 'FAB-ORD-1002',
      buyerId: 'usr_buyer_001',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Alex Mercer (Customer)',
      totalAmount: 2398.0,
      status: OrderStatus.DELIVERED,
      paymentMethod: 'NET_BANKING',
      paymentId: 'pay_live_002',
      items: [
        {
          id: 'item_002',
          orderId: 'ord_002',
          productId: 'prod_009',
          productTitle: 'Windows 11 Professional — Lifetime License OEM',
          quantity: 1,
          priceAtPurchase: 1399.0,
        },
        {
          id: 'item_003',
          orderId: 'ord_002',
          productId: 'prod_002',
          productTitle: 'Grand Theft Auto V: Premium Edition',
          quantity: 1,
          priceAtPurchase: 999.0,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    },
    {
      id: 'ord_003',
      orderNumber: 'FAB-ORD-1003',
      buyerId: 'usr_buyer_001',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Alex Mercer (Customer)',
      totalAmount: 3450.0,
      status: OrderStatus.PROCESSING,
      paymentMethod: 'UPI',
      paymentId: 'pay_live_003',
      items: [
        {
          id: 'item_004',
          orderId: 'ord_003',
          productId: 'prod_004',
          productTitle: 'Elden Ring — Shadow of the Erdtree Edition',
          quantity: 1,
          priceAtPurchase: 3450.0,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  auditLogs: [
    {
      id: 'aud_001',
      adminId: 'usr_admin_001',
      adminEmail: 'admin@fanar.com',
      action: 'STORE_INITIALIZED',
      targetType: 'PRODUCT',
      targetId: 'prod_001',
      targetName: 'Fanar Al Bhar Store Initialized',
      details: 'Single-vendor e-commerce store catalog configured successfully.',
      createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    },
  ],
  addresses: [],
  wishlists: [],
  reviews: [],
  settings: DEFAULT_SETTINGS,
  coupons: [
    {
      id: 'cpn_001',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 500,
      startDate: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      expiryDate: new Date(Date.now() + 3600000 * 24 * 365).toISOString(),
      usageLimit: 1000,
      usageCount: 0,
      perCustomerLimit: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cpn_002',
      code: 'FANAR500',
      discountType: 'FIXED',
      discountValue: 500,
      minOrderAmount: 2000,
      maxDiscount: 500,
      startDate: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      expiryDate: new Date(Date.now() + 3600000 * 24 * 365).toISOString(),
      usageLimit: 500,
      usageCount: 0,
      perCustomerLimit: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  couponUsages: [],
  notifications: [],
};

function readDb(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_STATE, null, 2), 'utf-8');
      return INITIAL_STATE;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as any;

    // Migrate from multi-vendor to single-vendor if old fields exist
    const state: DatabaseState = {
      users: (parsed.users || INITIAL_STATE.users).map((u: any) => ({
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        firstName: u.firstName || null,
        lastName: u.lastName || null,
        phone: u.phone || null,
        avatarUrl: u.avatarUrl || null,
        role: u.role === 'SELLER' ? Role.BUYER : (u.role as Role), // Map any old seller to buyer
        status: u.status || AccountStatus.ACTIVE,
        emailVerified: u.emailVerified || null,
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString(),
      })),
      passwordResetTokens: parsed.passwordResetTokens || [],
      emailVerificationTokens: parsed.emailVerificationTokens || [],
      categories: (parsed.categories && parsed.categories.length > 0 ? parsed.categories : INITIAL_CATEGORIES).map(
        (c: any) => ({
          ...c,
          isActive: c.isActive !== undefined ? c.isActive : true,
          imageUrl: c.imageUrl || null,
          createdAt: c.createdAt || new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
        })
      ),
      platforms: parsed.platforms && parsed.platforms.length > 0 ? parsed.platforms : INITIAL_PLATFORMS,
      products: (parsed.products && parsed.products.length > 0 && parsed.products[0].price !== undefined
        ? parsed.products
        : INITIAL_PRODUCTS
      ).map((p: any) => ({
        ...p,
        title: p.title || p.name || 'Untitled Product',
        coverImageUrl: p.coverImageUrl || p.images?.[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
      })),
      productKeys: parsed.productKeys && parsed.productKeys.length > 0 && parsed.productKeys[0].productId !== undefined
        ? parsed.productKeys
        : INITIAL_KEYS,
      carts: (parsed.carts || []).map((c: any) => ({
        id: c.id,
        userId: c.userId,
        items: (c.items || []).map((it: any) => ({
          id: it.id,
          cartId: it.cartId || c.id,
          productId: it.productId,
          quantity: it.quantity || 1,
          createdAt: it.createdAt || new Date().toISOString(),
          updatedAt: it.updatedAt || new Date().toISOString(),
        })),
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
      })),
      orders: (parsed.orders && parsed.orders.length > 0 && parsed.orders[0].orderNumber?.startsWith('FAB-')
        ? parsed.orders
        : INITIAL_STATE.orders
      ).map((o: any) => ({
        ...o,
        subtotal: o.subtotal ?? o.totalAmount,
        discount: o.discount ?? 0,
        tax: o.tax ?? 0,
        shipping: o.shipping ?? 0,
        currency: o.currency ?? 'INR',
        paymentStatus: o.paymentStatus ?? (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CONFIRMED ? 'PAID' : 'PENDING'),
      })),
      auditLogs: parsed.auditLogs || INITIAL_STATE.auditLogs,
      addresses: parsed.addresses || [],
      wishlists: parsed.wishlists || [],
      reviews: parsed.reviews || [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      coupons: parsed.coupons || INITIAL_STATE.coupons,
      couponUsages: parsed.couponUsages || [],
      notifications: parsed.notifications || [],
    };

    return state;
  } catch (err) {
    console.error('Error reading persistence store, using initial state:', err);
    return INITIAL_STATE;
  }
}

function writeDb(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing persistence store:', err);
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// UNIFIED SINGLE-VENDOR DATABASE CLIENT
// ---------------------------------------------------------------------------

export const db = {
  user: {
    async findUnique(args: {
      where: { id?: string; email?: string };
      include?: { orders?: boolean };
    }): Promise<StoredUser | null> {
      const state = readDb();
      const user = state.users.find(
        (u) =>
          (args.where.id && u.id === args.where.id) ||
          (args.where.email && u.email.toLowerCase() === args.where.email.toLowerCase())
      );
      if (!user) return null;

      if (args.include?.orders) {
        const orders = state.orders.filter((o) => o.buyerId === user.id);
        return { ...user, orders };
      }

      return user;
    },

    async findMany(args?: {
      where?: {
        role?: Role;
        status?: AccountStatus;
        search?: string;
      };
      take?: number;
      skip?: number;
    }): Promise<StoredUser[]> {
      const state = readDb();
      let users = [...state.users];

      if (args?.where) {
        if (args.where.role) {
          users = users.filter((u) => u.role === args.where!.role);
        }
        if (args.where.status) {
          users = users.filter((u) => u.status === args.where!.status);
        }
        if (args.where.search) {
          const q = args.where.search.toLowerCase();
          users = users.filter(
            (u) => u.email.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
          );
        }
      }

      if (args?.skip) users = users.slice(args.skip);
      if (args?.take) users = users.slice(0, args.take);

      return users;
    },

    async create(args: {
      data: {
        email: string;
        passwordHash?: string | null;
        name?: string | null;
        role?: Role;
        status?: AccountStatus;
        emailVerified?: Date | null;
      };
    }): Promise<StoredUser> {
      const state = readDb();
      const existing = state.users.find(
        (u) => u.email.toLowerCase() === args.data.email.toLowerCase()
      );
      if (existing) {
        throw new Error('A user with this email address already exists.');
      }

      const newUser: StoredUser = {
        id: generateId('usr'),
        email: args.data.email.toLowerCase(),
        passwordHash: args.data.passwordHash || null,
        name: args.data.name || null,
        avatarUrl: null,
        role: args.data.role || Role.BUYER,
        status: args.data.status || AccountStatus.ACTIVE,
        emailVerified: args.data.emailVerified ? args.data.emailVerified.toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.users.push(newUser);
      writeDb(state);
      return newUser;
    },

    async update(args: {
      where: { id?: string; email?: string };
      data: Partial<Omit<StoredUser, 'id' | 'createdAt'>>;
    }): Promise<StoredUser> {
      const state = readDb();
      const index = state.users.findIndex(
        (u) =>
          (args.where.id && u.id === args.where.id) ||
          (args.where.email && u.email.toLowerCase() === args.where.email.toLowerCase())
      );

      if (index === -1) {
        throw new Error('User not found to update.');
      }

      const updated: StoredUser = {
        ...state.users[index],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };

      state.users[index] = updated;
      writeDb(state);
      return updated;
    },

    async count(args?: { where?: { role?: Role; status?: AccountStatus } }): Promise<number> {
      const state = readDb();
      let list = state.users;
      if (args?.where) {
        if (args.where.role) list = list.filter((u) => u.role === args.where!.role);
        if (args.where.status) list = list.filter((u) => u.status === args.where!.status);
      }
      return list.length;
    },

    async updateProfile(
      userId: string,
      data: { firstName?: string | null; lastName?: string | null; phone?: string | null }
    ): Promise<StoredUser> {
      const state = readDb();
      const index = state.users.findIndex((u) => u.id === userId);
      if (index === -1) throw new Error('User not found');

      const current = state.users[index];
      const firstName = data.firstName !== undefined ? data.firstName?.trim() || null : current.firstName || null;
      const lastName = data.lastName !== undefined ? data.lastName?.trim() || null : current.lastName || null;
      const phone = data.phone !== undefined ? data.phone?.trim() || null : current.phone || null;

      const fullName = [firstName, lastName].filter(Boolean).join(' ') || current.name;

      const updated: StoredUser = {
        ...current,
        firstName,
        lastName,
        name: fullName,
        phone,
        updatedAt: new Date().toISOString(),
      };

      state.users[index] = updated;
      writeDb(state);
      return updated;
    },

    async findManyWithStats(args?: {
      role?: Role;
      search?: string;
      status?: AccountStatus;
      skip?: number;
      take?: number;
    }) {
      const state = readDb();
      let users = [...state.users];

      if (args?.role) {
        users = users.filter((u) => u.role === args.role);
      } else {
        users = users.filter((u) => u.role === Role.BUYER);
      }

      if (args?.status) {
        users = users.filter((u) => u.status === args.status);
      }

      if (args?.search) {
        const q = args.search.toLowerCase();
        users = users.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.phone && u.phone.toLowerCase().includes(q))
        );
      }

      const totalCount = users.length;

      if (args?.skip) users = users.slice(args.skip);
      if (args?.take) users = users.slice(0, args.take);

      const customerStats = users.map((u) => {
        const userOrders = state.orders.filter((o) => o.buyerId === u.id);
        const paidOrders = userOrders.filter(
          (o) => o.paymentStatus === 'PAID' || o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CONFIRMED
        );
        const totalSpent = paidOrders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);

        return {
          id: u.id,
          email: u.email,
          name: u.name,
          firstName: u.firstName || null,
          lastName: u.lastName || null,
          phone: u.phone || null,
          role: u.role,
          status: u.status,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          orderCount: userOrders.length,
          paidOrderCount: paidOrders.length,
          totalSpent,
        };
      });

      return {
        customers: customerStats,
        total: totalCount,
      };
    },

    async findUniqueWithStats(userId: string) {
      const state = readDb();
      const user = state.users.find((u) => u.id === userId);
      if (!user) return null;

      const userOrders = state.orders
        .filter((o) => o.buyerId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const paidOrders = userOrders.filter(
        (o) => o.paymentStatus === 'PAID' || o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CONFIRMED
      );
      const totalSpent = paidOrders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);
      const addresses = state.addresses.filter((a) => a.userId === user.id);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        phone: user.phone || null,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        orderCount: userOrders.length,
        paidOrderCount: paidOrders.length,
        totalSpent,
        addresses,
        orders: userOrders,
      };
    },

    async updateStatus(userId: string, status: AccountStatus): Promise<StoredUser> {
      const state = readDb();
      const index = state.users.findIndex((u) => u.id === userId);
      if (index === -1) throw new Error('Customer not found');

      state.users[index].status = status;
      state.users[index].updatedAt = new Date().toISOString();
      writeDb(state);
      return state.users[index];
    },
  },

  category: {
    async findMany(args?: {
      where?: { isActive?: boolean; search?: string };
    }): Promise<Array<StoredCategory & { productCount: number }>> {
      const state = readDb();
      let list = state.categories.map((c) => ({
        ...c,
        isActive: c.isActive !== undefined ? c.isActive : true,
        productCount: state.products.filter((p) => p.categoryId === c.id).length,
      }));

      if (args?.where) {
        if (args.where.isActive !== undefined) {
          list = list.filter((c) => c.isActive === args.where!.isActive);
        }
        if (args.where.search) {
          const q = args.where.search.toLowerCase().trim();
          list = list.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
        }
      }

      return list;
    },

    async findUnique(args: { where: { id?: string; slug?: string } }): Promise<(StoredCategory & { productCount: number }) | null> {
      const state = readDb();
      const cat = state.categories.find(
        (c) => (args.where.id && c.id === args.where.id) || (args.where.slug && c.slug === args.where.slug)
      );
      if (!cat) return null;
      return {
        ...cat,
        isActive: cat.isActive !== undefined ? cat.isActive : true,
        productCount: state.products.filter((p) => p.categoryId === cat.id).length,
      };
    },

    async create(args: {
      data: {
        name: string;
        slug?: string;
        description?: string | null;
        imageUrl?: string | null;
        isActive?: boolean;
      };
      adminUser?: { id: string; email: string };
    }): Promise<StoredCategory> {
      const state = readDb();
      const name = args.data.name.trim();
      const slug = (args.data.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).toLowerCase();

      // Duplicate check
      if (state.categories.some((c) => c.slug === slug || c.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`A category with name "${name}" or slug "${slug}" already exists.`);
      }

      const newCategory: StoredCategory = {
        id: generateId('cat'),
        name,
        slug,
        description: args.data.description || null,
        imageUrl: args.data.imageUrl || null,
        isActive: args.data.isActive !== undefined ? args.data.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.categories.push(newCategory);
      writeDb(state);

      if (args.adminUser) {
        await db.auditLog.create({
          data: {
            adminId: args.adminUser.id,
            adminEmail: args.adminUser.email,
            action: 'CATEGORY_CREATED',
            targetType: 'CATEGORY',
            targetId: newCategory.id,
            targetName: newCategory.name,
            details: `Created category "${newCategory.name}" (${newCategory.slug})`,
          },
        });
      }

      return newCategory;
    },

    async update(args: {
      where: { id: string };
      data: {
        name?: string;
        slug?: string;
        description?: string | null;
        imageUrl?: string | null;
        isActive?: boolean;
      };
      adminUser?: { id: string; email: string };
    }): Promise<StoredCategory> {
      const state = readDb();
      const index = state.categories.findIndex((c) => c.id === args.where.id);
      if (index === -1) throw new Error('Category not found');

      const current = state.categories[index];
      const newSlug = args.data.slug
        ? args.data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : current.slug;

      if (newSlug !== current.slug) {
        const conflict = state.categories.find((c) => c.id !== current.id && c.slug === newSlug);
        if (conflict) throw new Error(`Category slug "${newSlug}" is already taken.`);
      }

      const updated: StoredCategory = {
        ...current,
        name: args.data.name !== undefined ? args.data.name.trim() : current.name,
        slug: newSlug,
        description: args.data.description !== undefined ? args.data.description : current.description,
        imageUrl: args.data.imageUrl !== undefined ? args.data.imageUrl : current.imageUrl,
        isActive: args.data.isActive !== undefined ? args.data.isActive : current.isActive,
        updatedAt: new Date().toISOString(),
      };

      state.categories[index] = updated;
      writeDb(state);

      if (args.adminUser) {
        await db.auditLog.create({
          data: {
            adminId: args.adminUser.id,
            adminEmail: args.adminUser.email,
            action: 'CATEGORY_UPDATED',
            targetType: 'CATEGORY',
            targetId: updated.id,
            targetName: updated.name,
            details: `Updated category "${updated.name}" (${updated.slug})`,
          },
        });
      }

      return updated;
    },

    async delete(args: { where: { id: string }; adminUser?: { id: string; email: string } }): Promise<boolean> {
      const state = readDb();
      const index = state.categories.findIndex((c) => c.id === args.where.id);
      if (index === -1) throw new Error('Category not found');

      const target = state.categories[index];
      const linkedProducts = state.products.filter((p) => p.categoryId === target.id);
      if (linkedProducts.length > 0) {
        throw new Error(
          `Cannot delete category "${target.name}": ${linkedProducts.length} product(s) are associated with it. Please reassign or deactivate the category instead.`
        );
      }

      state.categories.splice(index, 1);
      writeDb(state);

      if (args.adminUser) {
        await db.auditLog.create({
          data: {
            adminId: args.adminUser.id,
            adminEmail: args.adminUser.email,
            action: 'CATEGORY_DELETED',
            targetType: 'CATEGORY',
            targetId: target.id,
            targetName: target.name,
            details: `Deleted category "${target.name}" (${target.slug})`,
          },
        });
      }

      return true;
    },
  },

  platform: {
    async findMany(): Promise<StoredPlatform[]> {
      const state = readDb();
      return state.platforms;
    },
    async findUnique(args: { where: { id?: string; slug?: string } }): Promise<StoredPlatform | null> {
      const state = readDb();
      return (
        state.platforms.find(
          (p) => (args.where.id && p.id === args.where.id) || (args.where.slug && p.slug === args.where.slug)
        ) || null
      );
    },
  },

  product: {
    async findMany(args?: {
      where?: {
        categoryId?: string;
        categorySlug?: string;
        platformId?: string;
        platformSlug?: string;
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
        search?: string;
        status?: string;
        stockStatus?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        inStock?: boolean;
        onSale?: boolean;
      };
      orderBy?: {
        price?: 'asc' | 'desc';
        createdAt?: 'asc' | 'desc';
        stock?: 'asc' | 'desc';
        title?: 'asc' | 'desc';
        discount?: 'asc' | 'desc';
        featured?: boolean;
      };
      take?: number;
      skip?: number;
    }): Promise<StoredProduct[]> {
      const state = readDb();
      let list = [...state.products];

      if (args?.where) {
        if (args.where.categoryId && args.where.categoryId !== 'all') {
          list = list.filter((p) => p.categoryId === args.where!.categoryId);
        }
        if (args.where.categorySlug && args.where.categorySlug !== 'all') {
          const matchedCategory = state.categories.find(
            (c) => c.slug.toLowerCase() === args.where!.categorySlug!.toLowerCase()
          );
          if (matchedCategory) {
            list = list.filter((p) => p.categoryId === matchedCategory.id);
          } else {
            // Slug doesn't match any category
            list = [];
          }
        }
        if (args.where.platformId && args.where.platformId !== 'all') {
          list = list.filter((p) => p.platformId === args.where!.platformId);
        }
        if (args.where.platformSlug && args.where.platformSlug !== 'all') {
          const matchedPlat = state.platforms.find(
            (pl) => pl.slug.toLowerCase() === args.where!.platformSlug!.toLowerCase()
          );
          if (matchedPlat) {
            list = list.filter((p) => p.platformId === matchedPlat.id);
          } else {
            list = [];
          }
        }
        if (args.where.brand && args.where.brand !== 'all') {
          list = list.filter(
            (p) => p.brand && p.brand.toLowerCase() === args.where!.brand!.toLowerCase()
          );
        }
        if (args.where.status && args.where.status !== 'all') {
          list = list.filter((p) => (p.status || 'PUBLISHED') === args.where!.status);
        }
        if (args.where.stockStatus && args.where.stockStatus !== 'all') {
          if (args.where.stockStatus === 'in_stock') {
            list = list.filter((p) => p.stockQuantity > (p.lowStockThreshold ?? 5));
          } else if (args.where.stockStatus === 'low_stock') {
            list = list.filter(
              (p) => p.stockQuantity <= (p.lowStockThreshold ?? 5) && p.stockQuantity > 0
            );
          } else if (args.where.stockStatus === 'out_of_stock') {
            list = list.filter((p) => p.stockQuantity <= 0);
          }
        }
        if (args.where.isActive !== undefined) {
          list = list.filter((p) => p.isActive === args.where!.isActive);
        }
        if (args.where.isFeatured !== undefined) {
          list = list.filter((p) => p.isFeatured === args.where!.isFeatured);
        }
        if (args.where.inStock) {
          list = list.filter((p) => p.stockQuantity > 0);
        }
        if (args.where.onSale) {
          list = list.filter((p) => {
            const hasDiscount =
              p.discountPrice !== null &&
              p.discountPrice !== undefined &&
              p.discountPrice > 0 &&
              p.discountPrice !== p.price;
            if (!hasDiscount) return false;
            const now = new Date();
            if (p.discountStartDate && new Date(p.discountStartDate) > now) return false;
            if (p.discountEndDate && new Date(p.discountEndDate) < now) return false;
            return true;
          });
        }
        if (args.where.minPrice !== undefined) {
          list = list.filter((p) => {
            const effectivePrice =
              p.discountPrice !== null && p.discountPrice !== undefined && p.discountPrice > 0
                ? Math.min(p.price, p.discountPrice)
                : p.price;
            return effectivePrice >= args.where!.minPrice!;
          });
        }
        if (args.where.maxPrice !== undefined) {
          list = list.filter((p) => {
            const effectivePrice =
              p.discountPrice !== null && p.discountPrice !== undefined && p.discountPrice > 0
                ? Math.min(p.price, p.discountPrice)
                : p.price;
            return effectivePrice <= args.where!.maxPrice!;
          });
        }
        if (args.where.search) {
          const q = args.where.search.toLowerCase().trim();
          list = list.filter(
            (p) =>
              (p.title && p.title.toLowerCase().includes(q)) ||
              (p.slug && p.slug.toLowerCase().includes(q)) ||
              (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
              (p.description && p.description.toLowerCase().includes(q)) ||
              (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
              (p.platformName && p.platformName.toLowerCase().includes(q)) ||
              (p.brand && p.brand.toLowerCase().includes(q)) ||
              (p.sku && p.sku.toLowerCase().includes(q))
          );
        }
      }

      if (args?.orderBy?.featured) {
        list.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else if (args?.orderBy?.discount) {
        list.sort((a, b) => {
          const getDisc = (p: StoredProduct) => {
            if (!p.discountPrice || p.discountPrice === p.price) return 0;
            const high = Math.max(p.price, p.discountPrice);
            const low = Math.min(p.price, p.discountPrice);
            return ((high - low) / high) * 100;
          };
          return args.orderBy!.discount === 'asc'
            ? getDisc(a) - getDisc(b)
            : getDisc(b) - getDisc(a);
        });
      } else if (args?.orderBy?.price) {
        list.sort((a, b) => {
          const getEffective = (p: StoredProduct) =>
            p.discountPrice && p.discountPrice > 0 ? Math.min(p.price, p.discountPrice) : p.price;
          return args.orderBy!.price === 'asc'
            ? getEffective(a) - getEffective(b)
            : getEffective(b) - getEffective(a);
        });
      } else if (args?.orderBy?.stock) {
        list.sort((a, b) =>
          args.orderBy!.stock === 'asc'
            ? a.stockQuantity - b.stockQuantity
            : b.stockQuantity - a.stockQuantity
        );
      } else if (args?.orderBy?.title) {
        list.sort((a, b) =>
          args.orderBy!.title === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title)
        );
      } else if (args?.orderBy?.createdAt) {
        list.sort((a, b) =>
          args.orderBy!.createdAt === 'asc'
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);

      return list;
    },

    async getBrands(): Promise<string[]> {
      const state = readDb();
      const brands = new Set<string>();
      for (const p of state.products) {
        if (p.brand && p.brand.trim()) {
          brands.add(p.brand.trim());
        }
      }
      return Array.from(brands).sort();
    },

    async findUnique(args: {
      where: { id?: string; slug?: string; sku?: string };
      include?: { keys?: boolean };
    }): Promise<(StoredProduct & { keys?: StoredProductKey[] }) | null> {
      const state = readDb();
      const product = state.products.find(
        (p) =>
          (args.where.id && p.id === args.where.id) ||
          (args.where.slug && p.slug === args.where.slug) ||
          (args.where.sku && p.sku && p.sku.toLowerCase() === args.where.sku.toLowerCase())
      );
      if (!product) return null;

      if (args.include?.keys) {
        const keys = state.productKeys.filter((k) => k.productId === product.id);
        return { ...product, keys };
      }

      return product;
    },

    async create(args: {
      data: Omit<StoredProduct, 'id' | 'createdAt' | 'updatedAt'>;
    }): Promise<StoredProduct> {
      const state = readDb();

      // Validate Unique Slug
      const existingSlug = state.products.find(
        (p) => p.slug.toLowerCase() === args.data.slug.toLowerCase()
      );
      if (existingSlug) {
        throw new Error(`Product with slug "${args.data.slug}" already exists.`);
      }

      // Validate Unique SKU
      if (args.data.sku && args.data.sku.trim()) {
        const existingSku = state.products.find(
          (p) => p.sku && p.sku.toLowerCase() === args.data.sku!.trim().toLowerCase()
        );
        if (existingSku) {
          throw new Error(`Product with SKU "${args.data.sku}" already exists.`);
        }
      }

      const category = state.categories.find((c) => c.id === args.data.categoryId);
      const platform = args.data.platformId
        ? state.platforms.find((p) => p.id === args.data.platformId)
        : null;

      const newProduct: StoredProduct = {
        ...args.data,
        id: generateId('prod'),
        status: args.data.status || 'PUBLISHED',
        lowStockThreshold: args.data.lowStockThreshold ?? 5,
        images: args.data.images && args.data.images.length > 0 ? args.data.images : [args.data.coverImageUrl],
        categoryName: category?.name || 'General',
        platformName: platform?.name || 'Multi-Platform',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.products.unshift(newProduct);
      writeDb(state);
      return newProduct;
    },

    async update(args: {
      where: { id: string };
      data: Partial<StoredProduct>;
    }): Promise<StoredProduct> {
      const state = readDb();
      const index = state.products.findIndex((p) => p.id === args.where.id);
      if (index === -1) {
        throw new Error('Product not found in catalog.');
      }

      const current = state.products[index];

      // Validate unique slug if being changed
      if (args.data.slug && args.data.slug.toLowerCase() !== current.slug.toLowerCase()) {
        const slugConflict = state.products.find(
          (p) => p.id !== args.where.id && p.slug.toLowerCase() === args.data.slug!.toLowerCase()
        );
        if (slugConflict) {
          throw new Error(`Product with slug "${args.data.slug}" already exists.`);
        }
      }

      // Validate unique SKU if being changed
      if (args.data.sku && (!current.sku || args.data.sku.toLowerCase() !== current.sku.toLowerCase())) {
        const skuConflict = state.products.find(
          (p) => p.id !== args.where.id && p.sku && p.sku.toLowerCase() === args.data.sku!.toLowerCase()
        );
        if (skuConflict) {
          throw new Error(`Product with SKU "${args.data.sku}" already exists.`);
        }
      }

      let categoryName = current.categoryName;
      if (args.data.categoryId && args.data.categoryId !== current.categoryId) {
        const cat = state.categories.find((c) => c.id === args.data.categoryId);
        if (cat) categoryName = cat.name;
      }

      let platformName = current.platformName;
      if (args.data.platformId && args.data.platformId !== current.platformId) {
        const plat = state.platforms.find((p) => p.id === args.data.platformId);
        if (plat) platformName = plat.name;
      }

      const updated: StoredProduct = {
        ...current,
        ...args.data,
        categoryName,
        platformName,
        updatedAt: new Date().toISOString(),
      };

      state.products[index] = updated;
      writeDb(state);
      return updated;
    },

    async updateStock(id: string, newStock: number, adminUser?: { id: string; email: string }): Promise<StoredProduct> {
      if (newStock < 0) throw new Error('Stock quantity cannot be negative.');
      const state = readDb();
      const index = state.products.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Product not found to update stock.');

      const prod = state.products[index];
      const oldStock = prod.stockQuantity;
      prod.stockQuantity = newStock;
      if (newStock === 0 && prod.status === 'PUBLISHED') {
        prod.status = 'OUT_OF_STOCK';
      } else if (newStock > 0 && prod.status === 'OUT_OF_STOCK') {
        prod.status = 'PUBLISHED';
      }
      prod.updatedAt = new Date().toISOString();
      writeDb(state);

      if (adminUser) {
        await db.auditLog.create({
          data: {
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: 'STOCK_CHANGED',
            targetType: 'PRODUCT',
            targetId: prod.id,
            targetName: prod.title,
            details: `Stock updated from ${oldStock} to ${newStock}`,
          },
        });
      }

      return prod;
    },

    async duplicate(id: string, adminUser?: { id: string; email: string }): Promise<StoredProduct> {
      const state = readDb();
      const original = state.products.find((p) => p.id === id);
      if (!original) throw new Error('Product not found to duplicate.');

      const newId = generateId('prod');
      const baseSlug = `${original.slug}-copy-${Date.now().toString(36)}`;
      const newSku = original.sku ? `${original.sku}-COPY-${Math.floor(100 + Math.random() * 900)}` : null;

      const cloned: StoredProduct = {
        ...original,
        id: newId,
        title: `${original.title} (Copy)`,
        slug: baseSlug,
        sku: newSku,
        status: 'DRAFT',
        isActive: false,
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.products.unshift(cloned);
      writeDb(state);

      if (adminUser) {
        await db.auditLog.create({
          data: {
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: 'PRODUCT_CREATED',
            targetType: 'PRODUCT',
            targetId: cloned.id,
            targetName: cloned.title,
            details: `Duplicated from product "${original.title}" (${original.id})`,
          },
        });
      }

      return cloned;
    },

    async togglePublish(id: string, publish: boolean, adminUser?: { id: string; email: string }): Promise<StoredProduct> {
      const state = readDb();
      const index = state.products.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Product not found.');

      const prod = state.products[index];
      prod.isActive = publish;
      prod.isPublished = publish;
      prod.status = publish ? (prod.stockQuantity > 0 ? 'PUBLISHED' : 'OUT_OF_STOCK') : 'UNPUBLISHED';
      prod.updatedAt = new Date().toISOString();

      writeDb(state);

      if (adminUser) {
        await db.auditLog.create({
          data: {
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: publish ? 'PRODUCT_PUBLISHED' : 'PRODUCT_UNPUBLISHED',
            targetType: 'PRODUCT',
            targetId: prod.id,
            targetName: prod.title,
            details: `Status set to ${prod.status}`,
          },
        });
      }

      return prod;
    },

    async updatePrice(
      id: string,
      price: number,
      discountPrice?: number | null,
      adminUser?: { id: string; email: string }
    ): Promise<StoredProduct> {
      if (price < 0) throw new Error('Price cannot be negative.');
      if (discountPrice !== undefined && discountPrice !== null && discountPrice < 0) {
        throw new Error('Discount price cannot be negative.');
      }

      const state = readDb();
      const index = state.products.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Product not found.');

      const prod = state.products[index];
      const oldPrice = prod.price;
      prod.price = price;
      if (discountPrice !== undefined) prod.discountPrice = discountPrice;
      prod.updatedAt = new Date().toISOString();

      writeDb(state);

      if (adminUser) {
        await db.auditLog.create({
          data: {
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: 'PRICE_CHANGED',
            targetType: 'PRODUCT',
            targetId: prod.id,
            targetName: prod.title,
            details: `Price changed from ₹${oldPrice} to ₹${price}${discountPrice ? ` (Sale: ₹${discountPrice})` : ''}`,
          },
        });
      }

      return prod;
    },

    async delete(args: string | { where: { id: string } }): Promise<StoredProduct> {
      const state = readDb();
      const targetId = typeof args === 'string' ? args : args?.where?.id;
      const index = state.products.findIndex((p) => p.id === targetId);
      if (index === -1) {
        throw new Error('Product not found to delete.');
      }
      const [removed] = state.products.splice(index, 1);
      writeDb(state);
      return removed;
    },

    async count(args?: { where?: any }): Promise<number> {
      const state = readDb();
      if (!args?.where) return state.products.length;
      const list = await db.product.findMany({ where: args.where });
      return list.length;
    },

    async countLowStock(threshold = 5): Promise<number> {
      const state = readDb();
      return state.products.filter(
        (p) =>
          p.isActive &&
          p.stockQuantity <= (p.lowStockThreshold ?? threshold) &&
          p.stockQuantity > 0
      ).length;
    },

    async countOutOfStock(): Promise<number> {
      const state = readDb();
      return state.products.filter((p) => p.isActive && p.stockQuantity <= 0).length;
    },
  },

  productKey: {
    async create(args: {
      data: {
        productId: string;
        cipherText: string;
        iv: string;
        tag: string;
        status?: KeyStatus;
      };
    }): Promise<StoredProductKey> {
      const state = readDb();
      const key: StoredProductKey = {
        id: generateId('key'),
        productId: args.data.productId,
        cipherText: args.data.cipherText,
        iv: args.data.iv,
        tag: args.data.tag,
        status: args.data.status || KeyStatus.AVAILABLE,
        isRevealed: false,
        revealedAt: null,
        createdAt: new Date().toISOString(),
      };

      state.productKeys.push(key);
      writeDb(state);
      return key;
    },

    async createMany(args: {
      data: Array<{
        productId: string;
        cipherText: string;
        iv: string;
        tag: string;
        status?: KeyStatus;
      }>;
    }): Promise<{ count: number }> {
      const state = readDb();
      let count = 0;
      for (const item of args.data) {
        const key: StoredProductKey = {
          id: generateId('key'),
          productId: item.productId,
          cipherText: item.cipherText,
          iv: item.iv,
          tag: item.tag,
          status: item.status || KeyStatus.AVAILABLE,
          isRevealed: false,
          revealedAt: null,
          createdAt: new Date().toISOString(),
        };
        state.productKeys.push(key);
        count++;
      }
      writeDb(state);
      return { count };
    },

    async findMany(args: {
      where: { productId?: string; status?: KeyStatus };
      take?: number;
    }): Promise<StoredProductKey[]> {
      const state = readDb();
      let list = state.productKeys;
      if (args.where.productId) {
        list = list.filter((k) => k.productId === args.where.productId);
      }
      if (args.where.status) {
        list = list.filter((k) => k.status === args.where.status);
      }
      if (args.take) list = list.slice(0, args.take);
      return list;
    },

    async countStats(productId: string): Promise<{ available: number; sold: number; total: number }> {
      const state = readDb();
      const keys = state.productKeys.filter((k) => k.productId === productId);
      const available = keys.filter((k) => k.status === KeyStatus.AVAILABLE).length;
      const sold = keys.filter((k) => k.status === KeyStatus.SOLD).length;
      return { available, sold, total: keys.length };
    },

    async findByOrderItemIds(orderItemIds: string[]): Promise<StoredProductKey[]> {
      const state = readDb();
      return state.productKeys.filter((k) => k.orderItemId && orderItemIds.includes(k.orderItemId));
    },

    async findByProductId(productId: string): Promise<StoredProductKey[]> {
      const state = readDb();
      return state.productKeys.filter((k) => k.productId === productId);
    },
  },

  cart: {
    async getOrCreate(userId: string): Promise<StoredCart> {
      const state = readDb();
      let cart = state.carts.find((c) => c.userId === userId);
      if (!cart) {
        cart = {
          id: generateId('cart'),
          userId,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.carts.push(cart);
        writeDb(state);
      }
      return cart;
    },

    async getWithDetails(userId: string): Promise<DetailedCart> {
      const cart = await this.getOrCreate(userId);
      const state = readDb();

      let subtotal = 0;
      let totalDiscount = 0;
      let hasUnavailableItems = false;

      const detailedItems: DetailedCartItem[] = [];

      for (const item of cart.items) {
        const product = state.products.find((p) => p.id === item.productId);
        if (!product) {
          hasUnavailableItems = true;
          continue;
        }

        const pricing = calculateProductPricing(product);
        const stockStatus = getStockStatus(product);

        const isPublished = (!product.status || product.status === 'PUBLISHED') && product.isActive;
        const hasStock = product.stockQuantity > 0;
        const requestedQuantityOk = item.quantity <= product.stockQuantity;

        const isAvailable = isPublished && hasStock && requestedQuantityOk;
        if (!isAvailable) {
          hasUnavailableItems = true;
        }

        let availabilityError: string | null = null;
        if (!isPublished) {
          availabilityError = 'This product is no longer available in our store.';
        } else if (!hasStock) {
          availabilityError = 'This product is currently out of stock.';
        } else if (!requestedQuantityOk) {
          availabilityError = `Requested quantity exceeds available inventory (${product.stockQuantity} left).`;
        }

        const unitPrice = pricing.currentPrice;
        const itemSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotal += itemSubtotal;

        if (pricing.isOnSale && pricing.regularPrice > pricing.currentPrice) {
          totalDiscount += (pricing.regularPrice - pricing.currentPrice) * item.quantity;
        }

        detailedItems.push({
          id: item.id,
          cartId: cart.id,
          productId: product.id,
          quantity: item.quantity,
          product: {
            id: product.id,
            title: product.title,
            slug: product.slug,
            coverImageUrl: product.coverImageUrl,
            sku: product.sku || null,
            deliveryType: product.deliveryType,
            categoryName: product.categoryName,
            platformName: product.platformName,
            stockQuantity: product.stockQuantity,
            inStock: product.stockQuantity > 0,
            stockStatus: stockStatus.status,
            regularPrice: pricing.regularPrice,
            salePrice: pricing.salePrice,
            currentPrice: pricing.currentPrice,
            discountPercent: pricing.discountPercent,
            isOnSale: pricing.isOnSale,
          },
          unitPrice,
          subtotal: itemSubtotal,
          isAvailable,
          availabilityError,
        });
      }

      const isAllDigital = detailedItems.every(
        (i) => i.product.deliveryType !== 'PHYSICAL_SHIPPING'
      );
      const shipping = isAllDigital || detailedItems.length === 0 ? 0 : 99;
      const tax = 0;
      const grandTotal = Math.round((subtotal + shipping + tax) * 100) / 100;

      return {
        id: cart.id,
        userId,
        items: detailedItems,
        itemCount: detailedItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        tax,
        shipping,
        total: grandTotal,
        currency: 'INR',
        hasUnavailableItems,
      };
    },

    async addItem(userId: string, productId: string, quantity: number): Promise<DetailedCart> {
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive integer greater than zero.');
      }

      await this.getOrCreate(userId);
      const state = readDb();
      const product = state.products.find((p) => p.id === productId);
      if (!product) {
        throw new Error('Product not found in catalog.');
      }
      if (product.stockQuantity <= 0 || product.status === 'OUT_OF_STOCK') {
        throw new Error('This product is out of stock.');
      }
      if (product.status && product.status !== 'PUBLISHED') {
        throw new Error('Unpublished products cannot be added to the cart.');
      }
      if (!product.isActive) {
        throw new Error('This product is currently inactive.');
      }

      const cart = state.carts.find((c) => c.userId === userId);
      if (!cart) {
        throw new Error('Cart could not be retrieved.');
      }
      const existingIndex = cart.items.findIndex((item) => item.productId === productId);

      if (existingIndex > -1) {
        const newQuantity = cart.items[existingIndex].quantity + quantity;
        if (newQuantity > product.stockQuantity) {
          throw new Error(
            `Cannot add ${quantity} more. Maximum available stock is ${product.stockQuantity}.`
          );
        }
        cart.items[existingIndex].quantity = newQuantity;
        cart.items[existingIndex].updatedAt = new Date().toISOString();
      } else {
        if (quantity > product.stockQuantity) {
          throw new Error(
            `Requested quantity (${quantity}) exceeds available stock (${product.stockQuantity}).`
          );
        }
        cart.items.push({
          id: generateId('ci'),
          cartId: cart.id,
          productId,
          quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      cart.updatedAt = new Date().toISOString();
      writeDb(state);

      return this.getWithDetails(userId);
    },

    async updateQuantity(userId: string, cartItemId: string, quantity: number): Promise<DetailedCart> {
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive integer greater than zero.');
      }

      const state = readDb();
      const cart = state.carts.find((c) => c.userId === userId);
      if (!cart) {
        throw new Error('Cart not found.');
      }

      const itemIndex = cart.items.findIndex((i) => i.id === cartItemId);
      if (itemIndex === -1) {
        throw new Error('Cart item not found or does not belong to your cart.');
      }

      const item = cart.items[itemIndex];
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error('Product no longer exists in catalog.');
      }

      if (quantity > product.stockQuantity) {
        throw new Error(
          `Requested quantity (${quantity}) exceeds available stock (${product.stockQuantity}).`
        );
      }

      item.quantity = quantity;
      item.updatedAt = new Date().toISOString();
      cart.updatedAt = new Date().toISOString();
      writeDb(state);

      return this.getWithDetails(userId);
    },

    async removeItem(userId: string, cartItemId: string): Promise<DetailedCart> {
      const state = readDb();
      const cart = state.carts.find((c) => c.userId === userId);
      if (!cart) {
        throw new Error('Cart not found.');
      }

      const initialLen = cart.items.length;
      cart.items = cart.items.filter((i) => i.id !== cartItemId);
      if (cart.items.length === initialLen) {
        throw new Error('Cart item not found or does not belong to your cart.');
      }

      cart.updatedAt = new Date().toISOString();
      writeDb(state);

      return this.getWithDetails(userId);
    },

    async clear(userId: string): Promise<void> {
      const state = readDb();
      const cart = state.carts.find((c) => c.userId === userId);
      if (cart) {
        cart.items = [];
        cart.updatedAt = new Date().toISOString();
        writeDb(state);
      }
    },
  },

  order: {
    async createPendingOrder(args: {
      buyerId: string;
      buyerEmail?: string;
      buyerName?: string | null;
      items: Array<{ productId: string; quantity: number }>;
      shippingAddress?: any;
      notes?: string | null;
      paymentMethod?: string | null;
      couponCode?: string | null;
    }): Promise<StoredOrder> {
      const state = readDb();

      if (!args.items || args.items.length === 0) {
        throw new Error('Cannot create an order with zero items.');
      }

      // DOUBLE STOCK VALIDATION & SERVER-SIDE PRICE SNAPSHOT
      const orderItems: StoredOrderItem[] = [];
      let subtotal = 0;
      let totalDiscount = 0;
      let isAllDigital = true;

      for (const item of args.items) {
        const product = state.products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product with ID "${item.productId}" does not exist.`);
        }
        if (product.stockQuantity < item.quantity || product.stockQuantity <= 0 || product.status === 'OUT_OF_STOCK') {
          throw new Error(`This product "${product.title}" is no longer available in the requested quantity.`);
        }
        if (product.status && product.status !== 'PUBLISHED') {
          throw new Error(`Product "${product.title}" is not published for sale.`);
        }
        if (!product.isActive) {
          throw new Error(`Product "${product.title}" is currently inactive.`);
        }

        const pricing = calculateProductPricing(product);
        const unitPrice = pricing.currentPrice;
        const itemSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotal += itemSubtotal;

        if (pricing.isOnSale && pricing.regularPrice > pricing.currentPrice) {
          totalDiscount += (pricing.regularPrice - pricing.currentPrice) * item.quantity;
        }

        if (product.deliveryType === 'PHYSICAL_SHIPPING') {
          isAllDigital = false;
        }

        orderItems.push({
          id: generateId('item'),
          orderId: '',
          productId: product.id,
          productTitle: product.title,
          sku: product.sku || null,
          quantity: item.quantity,
          priceAtPurchase: unitPrice,
          subtotal: itemSubtotal,
        });
      }

      const settings = state.settings || DEFAULT_SETTINGS;

      // 1. Dynamic Server-Side Shipping Calculation
      let shipping = 0;
      let shippingMethod = 'INSTANT_DIGITAL_DELIVERY';
      if (!isAllDigital) {
        const freeThreshold = settings.freeShippingThreshold ?? 999;
        const baseShipping = settings.shippingRate ?? 99;
        shipping = subtotal >= freeThreshold ? 0 : baseShipping;
        shippingMethod = subtotal >= freeThreshold ? 'Standard Express (Free)' : 'Standard Express Delivery';
      }

      // 2. Dynamic Server-Side Tax Calculation
      const taxPercent = settings.taxRatePercent ?? 0;
      const tax = taxPercent > 0 ? Math.round(subtotal * (taxPercent / 100) * 100) / 100 : 0;

      // 3. Dynamic Server-Side Coupon Validation & Calculation
      let couponDiscount = 0;
      let appliedCouponCode: string | null = null;
      if (args.couponCode) {
        const cpn = (state.coupons || []).find(
          (c) => c.code.toUpperCase() === args.couponCode!.trim().toUpperCase() && c.isActive
        );
        if (cpn) {
          const now = new Date();
          const isStarted = !cpn.startDate || new Date(cpn.startDate) <= now;
          const notExpired = !cpn.expiryDate || new Date(cpn.expiryDate) >= now;
          const minSatisfied = !cpn.minOrderAmount || subtotal >= cpn.minOrderAmount;
          const limitNotExceeded = !cpn.usageLimit || cpn.usageCount < cpn.usageLimit;
          const userUsageCount = (state.couponUsages || []).filter(
            (u) => u.couponId === cpn.id && u.userId === args.buyerId
          ).length;
          const userLimitNotExceeded = !cpn.perCustomerLimit || userUsageCount < cpn.perCustomerLimit;

          if (isStarted && notExpired && minSatisfied && limitNotExceeded && userLimitNotExceeded) {
            if (cpn.discountType === 'PERCENTAGE') {
              const rawDiscount = (subtotal * cpn.discountValue) / 100;
              couponDiscount = cpn.maxDiscount ? Math.min(rawDiscount, cpn.maxDiscount) : rawDiscount;
            } else {
              couponDiscount = Math.min(cpn.discountValue, subtotal);
            }
            couponDiscount = Math.max(0, Math.min(couponDiscount, subtotal));
            couponDiscount = Math.round(couponDiscount * 100) / 100;
            appliedCouponCode = cpn.code;
            cpn.usageCount += 1;
            cpn.updatedAt = new Date().toISOString();
          }
        }
      }

      const totalDiscountCombined = Math.round((totalDiscount + couponDiscount) * 100) / 100;
      const totalAmount = Math.max(0, Math.round((subtotal + shipping + tax - couponDiscount) * 100) / 100);

      const orderNumber = `FAB-ORD-${1000 + state.orders.length + 1}`;
      const orderId = generateId('ord');

      for (const oi of orderItems) {
        oi.orderId = orderId;
      }

      const order: StoredOrder = {
        id: orderId,
        orderNumber,
        buyerId: args.buyerId,
        buyerEmail: args.buyerEmail,
        buyerName: args.buyerName || null,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: totalDiscountCombined,
        tax,
        shipping,
        totalAmount,
        total: totalAmount,
        currency: 'INR',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: 'PENDING',
        paymentMethod: args.paymentMethod || 'PAYMENT_GATEWAY',
        paymentId: null,
        shippingAddress: args.shippingAddress || null,
        shippingMethod,
        trackingNumber: null,
        couponCode: appliedCouponCode,
        notes: args.notes || null,
        items: orderItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (appliedCouponCode) {
        state.couponUsages = state.couponUsages || [];
        const cpnObj = state.coupons?.find((c) => c.code === appliedCouponCode);
        if (cpnObj) {
          state.couponUsages.push({
            id: generateId('cpnu'),
            couponId: cpnObj.id,
            userId: args.buyerId,
            orderId: orderId,
            usedAt: new Date().toISOString(),
          });
        }
      }

      // Customer in-app notification
      state.notifications = state.notifications || [];
      state.notifications.unshift({
        id: generateId('notif'),
        userId: args.buyerId,
        title: 'Order Placed Successfully',
        message: `Your order #${orderNumber} for ₹${totalAmount} has been registered and is awaiting payment.`,
        type: 'ORDER_CONFIRMED',
        link: `/account/orders/${orderId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      state.orders.unshift(order);
      writeDb(state);

      // Auto-clear buyer cart upon pending order creation
      const cart = state.carts.find((c) => c.userId === args.buyerId);
      if (cart) {
        cart.items = [];
        cart.updatedAt = new Date().toISOString();
        writeDb(state);
      }

      // Dispatch order confirmation email
      if (args.buyerEmail) {
        sendOrderConfirmationEmail(args.buyerEmail, order).catch(() => {});
      }

      return order;
    },

    async confirmPayment(orderId: string, paymentId: string): Promise<StoredOrder> {
      const state = readDb();
      const orderIndex = state.orders.findIndex(
        (o) => o.id === orderId || o.orderNumber === orderId
      );
      if (orderIndex === -1) {
        throw new Error('Order not found to confirm payment.');
      }

      const order = state.orders[orderIndex];

      // IDEMPOTENCY GUARD: If order already PAID, return without double-reducing stock or double-delivering keys
      if (order.paymentStatus === 'PAID') {
        return order;
      }

      // ATOMIC STOCK REDUCTION & DIGITAL KEY ALLOCATION
      if (order.items) {
        for (const item of order.items) {
          const productIndex = state.products.findIndex((p) => p.id === item.productId);
          if (productIndex > -1) {
            const product = state.products[productIndex];
            const newStock = Math.max(0, product.stockQuantity - item.quantity);
            state.products[productIndex].stockQuantity = newStock;
            if (newStock === 0) {
              state.products[productIndex].status = 'OUT_OF_STOCK';
            }

            // Digital Key allocation
            if (product.deliveryType === 'INSTANT_KEY') {
              const availableKeys = state.productKeys.filter(
                (k) => k.productId === product.id && k.status === KeyStatus.AVAILABLE
              );
              const keysToAssign = availableKeys.slice(0, item.quantity);
              for (const k of keysToAssign) {
                k.status = KeyStatus.SOLD;
                k.orderItemId = item.id;
              }
            }
          }
        }
      }

      order.paymentStatus = 'PAID';
      order.status = OrderStatus.CONFIRMED;
      order.paymentId = paymentId;
      order.updatedAt = new Date().toISOString();

      // In-app customer notification & payment confirmation email
      state.notifications = state.notifications || [];
      state.notifications.unshift({
        id: generateId('notif'),
        userId: order.buyerId,
        title: 'Payment Confirmed & Keys Unsealed',
        message: `Payment of ₹${order.totalAmount} for order #${order.orderNumber} confirmed. Digital keys are now available in your account.`,
        type: 'PAYMENT_COMPLETED',
        link: `/account/orders/${order.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      state.orders[orderIndex] = order;
      writeDb(state);

      if (order.buyerEmail) {
        sendPaymentConfirmationEmail(order.buyerEmail, order).catch(() => {});
      }

      return order;
    },

    async updateStatus(
      orderId: string,
      status?: OrderStatus,
      options?: {
        adminId?: string;
        adminEmail?: string;
        paymentStatus?: any;
        force?: boolean;
        notes?: string;
        trackingNumber?: string | null;
        shippingMethod?: string | null;
      }
    ): Promise<StoredOrder> {
      const state = readDb();
      const order = state.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (!order) {
        throw new Error('Order not found to update status.');
      }

      if (status && status !== order.status && !options?.force) {
        const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
          [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
          [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
          [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
          [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
          [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
          [OrderStatus.CANCELLED]: [],
          [OrderStatus.REFUNDED]: [],
        };

        const allowed = ALLOWED_TRANSITIONS[order.status] || [];
        if (!allowed.includes(status)) {
          throw new Error(`Invalid order status transition from ${order.status} to ${status}`);
        }
      }

      const prevStatus = order.status;
      if (status) {
        order.status = status;
      }
      if (options?.paymentStatus) {
        order.paymentStatus = options.paymentStatus;
      }
      if (options?.notes) {
        order.notes = options.notes;
      }
      if (options?.trackingNumber !== undefined) {
        order.trackingNumber = options.trackingNumber;
      }
      if (options?.shippingMethod !== undefined) {
        order.shippingMethod = options.shippingMethod;
      }
      order.updatedAt = new Date().toISOString();

      // Trigger status notifications if status changed
      if (status && status !== prevStatus) {
        let notifTitle = `Order Status: ${status}`;
        let notifMsg = `Your order #${order.orderNumber} status has been updated to ${status}.`;
        let notifType = 'ORDER_STATUS_UPDATED';

        if (status === OrderStatus.CONFIRMED) {
          notifTitle = 'Order Confirmed';
          notifMsg = `Your order #${order.orderNumber} is confirmed and scheduled for processing.`;
          notifType = 'ORDER_CONFIRMED';
        } else if (status === OrderStatus.PROCESSING) {
          notifTitle = 'Order In Processing';
          notifMsg = `Your order #${order.orderNumber} is now being processed for fulfillment.`;
          notifType = 'ORDER_PROCESSING';
        } else if (status === OrderStatus.SHIPPED) {
          notifTitle = 'Order Shipped';
          notifMsg = `Your order #${order.orderNumber} has been dispatched! ${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`;
          notifType = 'ORDER_SHIPPED';
        } else if (status === OrderStatus.DELIVERED) {
          notifTitle = 'Order Delivered';
          notifMsg = `Your order #${order.orderNumber} has been successfully delivered.`;
          notifType = 'ORDER_DELIVERED';
        } else if (status === OrderStatus.CANCELLED) {
          notifTitle = 'Order Cancelled';
          notifMsg = `Your order #${order.orderNumber} has been cancelled.`;
          notifType = 'ORDER_CANCELLED';
        } else if (status === OrderStatus.REFUNDED) {
          notifTitle = 'Refund Processed';
          notifMsg = `A refund of ₹${order.totalAmount} has been processed for order #${order.orderNumber}.`;
          notifType = 'REFUND_PROCESSED';
        }

        state.notifications = state.notifications || [];
        state.notifications.unshift({
          id: generateId('notif'),
          userId: order.buyerId,
          title: notifTitle,
          message: notifMsg,
          type: notifType,
          link: `/account/orders/${order.id}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        if (order.buyerEmail) {
          sendOrderStatusUpdateEmail(order.buyerEmail, order, status, order.trackingNumber).catch(() => {});
        }
      }

      writeDb(state);

      if (options?.adminEmail || options?.adminId) {
        await db.auditLog.create({
          data: {
            adminId: options.adminId || 'usr_admin_001',
            adminEmail: options.adminEmail || 'admin@fanar.com',
            action: 'ORDER_STATUS_CHANGED',
            targetType: 'ORDER',
            targetId: order.id,
            targetName: order.orderNumber,
            details: `Status updated from ${prevStatus} to ${status || order.status}${options?.trackingNumber ? ` - Tracking: ${options.trackingNumber}` : ''}${options?.notes ? ` - Notes: ${options.notes}` : ''}`,
          },
        });
      }

      return order;
    },

    async findMany(args?: {
      where?: {
        buyerId?: string;
        status?: OrderStatus;
        paymentStatus?: string;
        search?: string;
      };
      orderBy?: { createdAt?: 'asc' | 'desc' };
      take?: number;
      skip?: number;
    }): Promise<StoredOrder[]> {
      const state = readDb();
      let list = [...state.orders];

      if (args?.where) {
        if (args.where.buyerId) {
          list = list.filter((o) => o.buyerId === args.where!.buyerId);
        }
        if (args.where.status) {
          list = list.filter((o) => o.status === args.where!.status);
        }
        if (args.where.paymentStatus) {
          list = list.filter((o) => o.paymentStatus === args.where!.paymentStatus);
        }
        if (args.where.search) {
          const q = args.where.search.toLowerCase().trim();
          list = list.filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              (o.buyerEmail && o.buyerEmail.toLowerCase().includes(q)) ||
              (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
              (o.paymentId && o.paymentId.toLowerCase().includes(q))
          );
        }
      }

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);

      return list;
    },

    async findUnique(args: {
      where: { id?: string; orderNumber?: string };
    }): Promise<StoredOrder | null> {
      const state = readDb();
      return (
        state.orders.find(
          (o) =>
            (args.where.id && o.id === args.where.id) ||
            (args.where.orderNumber && o.orderNumber === args.where.orderNumber)
        ) || null
      );
    },

    async count(args?: { where?: any }): Promise<number> {
      const state = readDb();
      if (!args?.where) return state.orders.length;
      const list = await db.order.findMany({ where: args.where });
      return list.length;
    },

    async aggregateSales(): Promise<{ totalRevenue: number; totalOrders: number; completedOrders: number }> {
      const state = readDb();
      const completed = state.orders.filter(
        (o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CONFIRMED || o.paymentStatus === 'PAID'
      );
      const totalRevenue = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: state.orders.length,
        completedOrders: completed.length,
      };
    },
  },

  auditLog: {
    async create(args: {
      data: {
        adminId: string;
        adminEmail: string;
        action: string;
        targetType: 'PRODUCT' | 'ORDER' | 'USER' | 'CATEGORY' | 'COUPON' | 'SETTING';
        targetId: string;
        targetName?: string | null;
        details?: string | null;
      };
    }): Promise<StoredAuditLog> {
      const state = readDb();
      const log: StoredAuditLog = {
        id: generateId('aud'),
        adminId: args.data.adminId,
        adminEmail: args.data.adminEmail,
        action: args.data.action,
        targetType: args.data.targetType,
        targetId: args.data.targetId,
        targetName: args.data.targetName || null,
        details: args.data.details || null,
        createdAt: new Date().toISOString(),
      };

      state.auditLogs.unshift(log);
      writeDb(state);
      return log;
    },

    async findMany(args?: { take?: number }): Promise<StoredAuditLog[]> {
      const state = readDb();
      let logs = [...state.auditLogs];
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (args?.take) logs = logs.slice(0, args.take);
      return logs;
    },
  },

  passwordResetToken: {
    async findUnique(args: { where: { token: string } }): Promise<StoredToken | null> {
      const state = readDb();
      return state.passwordResetTokens.find((t) => t.token === args.where.token) || null;
    },

    async create(args: {
      data: { userId: string; token: string; expiresAt: Date };
    }): Promise<StoredToken> {
      const state = readDb();
      const token: StoredToken = {
        id: generateId('prt'),
        userId: args.data.userId,
        token: args.data.token,
        expiresAt: args.data.expiresAt.toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
      };
      state.passwordResetTokens.push(token);
      writeDb(state);
      return token;
    },

    async update(args: {
      where: { token?: string; id?: string };
      data: { used: boolean };
    }): Promise<StoredToken> {
      const state = readDb();
      const index = state.passwordResetTokens.findIndex((t) => {
        if (args.where.token && t.token === args.where.token) return true;
        if (args.where.id && t.id === args.where.id) return true;
        return false;
      });
      if (index === -1) throw new Error('Token not found');
      state.passwordResetTokens[index].used = args.data.used;
      writeDb(state);
      return state.passwordResetTokens[index];
    },
  },

  emailVerificationToken: {
    async findUnique(args: { where: { token: string } }): Promise<StoredToken | null> {
      const state = readDb();
      return state.emailVerificationTokens.find((t) => t.token === args.where.token) || null;
    },

    async create(args: {
      data: { userId: string; token: string; expiresAt: Date };
    }): Promise<StoredToken> {
      const state = readDb();
      const token: StoredToken = {
        id: generateId('evt'),
        userId: args.data.userId,
        token: args.data.token,
        expiresAt: args.data.expiresAt.toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
      };
      state.emailVerificationTokens.push(token);
      writeDb(state);
      return token;
    },

    async update(args: {
      where: { token?: string; id?: string };
      data: { used: boolean };
    }): Promise<StoredToken> {
      const state = readDb();
      const index = state.emailVerificationTokens.findIndex((t) => {
        if (args.where.token && t.token === args.where.token) return true;
        if (args.where.id && t.id === args.where.id) return true;
        return false;
      });
      if (index === -1) throw new Error('Token not found');
      state.emailVerificationTokens[index].used = args.data.used;
      writeDb(state);
      return state.emailVerificationTokens[index];
    },
  },

  address: {
    async findMany(args: { where: { userId: string } }): Promise<StoredAddress[]> {
      const state = readDb();
      return state.addresses
        .filter((a) => a.userId === args.where.userId)
        .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    },

    async findUnique(args: { where: { id: string; userId?: string } }): Promise<StoredAddress | null> {
      const state = readDb();
      const addr = state.addresses.find((a) => a.id === args.where.id);
      if (!addr) return null;
      if (args.where.userId && addr.userId !== args.where.userId) return null;
      return addr;
    },

    async create(args: {
      data: {
        userId: string;
        fullName: string;
        phone: string;
        addressLine: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault?: boolean;
      };
    }): Promise<StoredAddress> {
      const state = readDb();
      const userAddresses = state.addresses.filter((a) => a.userId === args.data.userId);
      const isDefault = args.data.isDefault ?? userAddresses.length === 0;

      if (isDefault) {
        state.addresses.forEach((a) => {
          if (a.userId === args.data.userId) a.isDefault = false;
        });
      }

      const address: StoredAddress = {
        id: generateId('addr'),
        userId: args.data.userId,
        fullName: args.data.fullName.trim(),
        phone: args.data.phone.trim(),
        addressLine: args.data.addressLine.trim(),
        city: args.data.city.trim(),
        state: args.data.state.trim(),
        postalCode: args.data.postalCode.trim(),
        country: args.data.country.trim(),
        isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.addresses.push(address);
      writeDb(state);
      return address;
    },

    async update(args: {
      where: { id: string; userId: string };
      data: Partial<Omit<StoredAddress, 'id' | 'userId' | 'createdAt'>>;
    }): Promise<StoredAddress> {
      const state = readDb();
      const index = state.addresses.findIndex(
        (a) => a.id === args.where.id && a.userId === args.where.userId
      );
      if (index === -1) throw new Error('Address not found or unauthorized');

      if (args.data.isDefault) {
        state.addresses.forEach((a) => {
          if (a.userId === args.where.userId) a.isDefault = false;
        });
      }

      state.addresses[index] = {
        ...state.addresses[index],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };

      writeDb(state);
      return state.addresses[index];
    },

    async delete(args: { where: { id: string; userId: string } }): Promise<boolean> {
      const state = readDb();
      const index = state.addresses.findIndex(
        (a) => a.id === args.where.id && a.userId === args.where.userId
      );
      if (index === -1) throw new Error('Address not found or unauthorized');

      const wasDefault = state.addresses[index].isDefault;
      state.addresses.splice(index, 1);

      if (wasDefault) {
        const remaining = state.addresses.find((a) => a.userId === args.where.userId);
        if (remaining) remaining.isDefault = true;
      }

      writeDb(state);
      return true;
    },

    async setDefault(args: { where: { id: string; userId: string } }): Promise<StoredAddress> {
      const state = readDb();
      const index = state.addresses.findIndex(
        (a) => a.id === args.where.id && a.userId === args.where.userId
      );
      if (index === -1) throw new Error('Address not found or unauthorized');

      state.addresses.forEach((a) => {
        if (a.userId === args.where.userId) a.isDefault = false;
      });

      state.addresses[index].isDefault = true;
      state.addresses[index].updatedAt = new Date().toISOString();
      writeDb(state);
      return state.addresses[index];
    },
  },

  wishlist: {
    async getItems(args: { where: { userId: string } }) {
      const state = readDb();
      const userWishlist = state.wishlists.filter((w) => w.userId === args.where.userId);
      const items = userWishlist
        .map((w) => {
          const product = state.products.find((p) => p.id === w.productId);
          if (!product) return null;
          const pricing = calculateProductPricing(product);
          const stock = getStockStatus(product);
          return {
            id: w.id,
            productId: product.id,
            userId: w.userId,
            createdAt: w.createdAt,
            product: {
              id: product.id,
              title: product.title,
              slug: product.slug,
              coverImageUrl: product.coverImageUrl,
              categoryName: product.categoryName,
              platformName: product.platformName,
              deliveryType: product.deliveryType,
              price: pricing.currentPrice,
              originalPrice: pricing.regularPrice,
              discountPercent: pricing.discountPercent,
              isAvailable: product.isActive && product.stockQuantity > 0,
              stock: product.stockQuantity,
            },
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return items;
    },

    async addItem(args: { data: { userId: string; productId: string } }) {
      const state = readDb();
      const product = state.products.find((p) => p.id === args.data.productId);
      if (!product) throw new Error('Product not found');

      const existing = state.wishlists.find(
        (w) => w.userId === args.data.userId && w.productId === args.data.productId
      );
      if (existing) {
        return existing;
      }

      const item: StoredWishlistItem = {
        id: generateId('wsh'),
        userId: args.data.userId,
        productId: args.data.productId,
        createdAt: new Date().toISOString(),
      };

      state.wishlists.push(item);
      writeDb(state);
      return item;
    },

    async removeItem(args: { where: { userId: string; productId: string } }): Promise<boolean> {
      const state = readDb();
      const index = state.wishlists.findIndex(
        (w) => w.userId === args.where.userId && w.productId === args.where.productId
      );
      if (index === -1) return false;

      state.wishlists.splice(index, 1);
      writeDb(state);
      return true;
    },

    async hasItem(args: { userId: string; productId: string }): Promise<boolean> {
      const state = readDb();
      return state.wishlists.some(
        (w) => w.userId === args.userId && w.productId === args.productId
      );
    },

    async count(args: { where: { userId: string } }): Promise<number> {
      const state = readDb();
      return state.wishlists.filter((w) => w.userId === args.where.userId).length;
    },

    async clear(args: { where: { userId: string } }): Promise<void> {
      const state = readDb();
      state.wishlists = state.wishlists.filter((w) => w.userId !== args.where.userId);
      writeDb(state);
    },
  },

  review: {
    async create(args: {
      data: {
        productId: string;
        buyerId: string;
        rating: number;
        comment: string;
      };
    }): Promise<StoredReview> {
      const state = readDb();
      const product = state.products.find((p) => p.id === args.data.productId);
      if (!product) throw new Error('Product not found');

      const buyer = state.users.find((u) => u.id === args.data.buyerId);
      if (!buyer) throw new Error('Buyer not found');

      if (
        !Number.isInteger(args.data.rating) ||
        args.data.rating < 1 ||
        args.data.rating > 5
      ) {
        throw new Error('Rating must be an integer between 1 and 5');
      }

      const existing = state.reviews.find(
        (r) => r.buyerId === args.data.buyerId && r.productId === args.data.productId
      );
      if (existing) {
        throw new Error('You have already reviewed this product');
      }

      const purchasedOrder = state.orders.find(
        (o) =>
          o.buyerId === args.data.buyerId &&
          (o.paymentStatus === 'PAID' || o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PROCESSING) &&
          o.items?.some((i) => i.productId === args.data.productId)
      );

      if (!purchasedOrder) {
        throw new Error('Only customers who purchased this product can submit a verified review');
      }

      const review: StoredReview = {
        id: generateId('rev'),
        productId: args.data.productId,
        buyerId: args.data.buyerId,
        buyerName: buyer.name || buyer.firstName || 'Customer',
        orderId: purchasedOrder.id,
        rating: args.data.rating,
        comment: args.data.comment.trim(),
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.reviews.push(review);
      writeDb(state);
      return review;
    },

    async findMany(args?: {
      where?: {
        productId?: string;
        buyerId?: string;
        isApproved?: boolean;
        isVerifiedPurchase?: boolean;
      };
      take?: number;
      skip?: number;
    }) {
      const state = readDb();
      let list = [...state.reviews];

      if (args?.where) {
        if (args.where.productId) list = list.filter((r) => r.productId === args.where!.productId);
        if (args.where.buyerId) list = list.filter((r) => r.buyerId === args.where!.buyerId);
        if (args.where.isApproved !== undefined) list = list.filter((r) => r.isApproved === args.where!.isApproved);
        if (args.where.isVerifiedPurchase !== undefined) list = list.filter((r) => r.isVerifiedPurchase === args.where!.isVerifiedPurchase);
      }

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = list.length;
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);

      const enriched = list.map((r) => {
        const prod = state.products.find((p) => p.id === r.productId);
        const buyer = state.users.find((u) => u.id === r.buyerId);
        return {
          ...r,
          productTitle: prod?.title || 'Unknown Product',
          productSlug: prod?.slug || '',
          productCoverImage: prod?.coverImageUrl || null,
          buyerEmail: buyer?.email,
          buyerDisplayName: r.buyerName || buyer?.name || 'Customer',
        };
      });

      return { reviews: enriched, total };
    },

    async findUnique(args: { where: { id: string } }): Promise<StoredReview | null> {
      const state = readDb();
      return state.reviews.find((r) => r.id === args.where.id) || null;
    },

    async update(args: {
      where: { id: string; buyerId?: string };
      data: Partial<Omit<StoredReview, 'id' | 'productId' | 'buyerId' | 'createdAt'>>;
    }): Promise<StoredReview> {
      const state = readDb();
      const index = state.reviews.findIndex(
        (r) => r.id === args.where.id && (!args.where.buyerId || r.buyerId === args.where.buyerId)
      );
      if (index === -1) throw new Error('Review not found or unauthorized');

      state.reviews[index] = {
        ...state.reviews[index],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };

      writeDb(state);
      return state.reviews[index];
    },

    async delete(args: { where: { id: string; buyerId?: string } }): Promise<boolean> {
      const state = readDb();
      const index = state.reviews.findIndex(
        (r) => r.id === args.where.id && (!args.where.buyerId || r.buyerId === args.where.buyerId)
      );
      if (index === -1) throw new Error('Review not found or unauthorized');

      state.reviews.splice(index, 1);
      writeDb(state);
      return true;
    },

    async getProductStats(productId: string) {
      const state = readDb();
      const reviews = state.reviews.filter((r) => r.productId === productId && r.isApproved);
      const totalReviews = reviews.length;
      if (totalReviews === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
      }

      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = Math.round((sum / totalReviews) * 10) / 10;
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) {
          breakdown[r.rating as 1 | 2 | 3 | 4 | 5] = (breakdown[r.rating as 1 | 2 | 3 | 4 | 5] || 0) + 1;
        }
      });

      return {
        averageRating,
        totalReviews,
        breakdown,
      };
    },

    async checkCanReview(userId: string, productId: string) {
      const state = readDb();
      const alreadyReviewed = state.reviews.some(
        (r) => r.buyerId === userId && r.productId === productId
      );

      const hasPurchased = state.orders.some(
        (o) =>
          o.buyerId === userId &&
          (o.paymentStatus === 'PAID' || o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PROCESSING) &&
          o.items?.some((i) => i.productId === productId)
      );

      return {
        canReview: hasPurchased && !alreadyReviewed,
        alreadyReviewed,
        hasPurchased,
      };
    },
  },

  inventory: {
    async getInventory(args?: {
      search?: string;
      status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
      skip?: number;
      take?: number;
    }) {
      const state = readDb();
      let list = state.products.map((p) => {
        const threshold = p.lowStockThreshold ?? 5;
        let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
        if (p.stockQuantity <= 0 || p.status === 'OUT_OF_STOCK') {
          stockStatus = 'OUT_OF_STOCK';
        } else if (p.stockQuantity <= threshold) {
          stockStatus = 'LOW_STOCK';
        }
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          sku: p.sku || 'N/A',
          coverImageUrl: p.coverImageUrl,
          price: p.price,
          discountPrice: p.discountPrice || null,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: threshold,
          status: p.status || 'PUBLISHED',
          deliveryType: p.deliveryType,
          isActive: p.isActive,
          categoryName: p.categoryName || 'Uncategorized',
          stockStatus,
          updatedAt: p.updatedAt,
        };
      });

      const totalCount = list.length;
      const inStockCount = list.filter((i) => i.stockStatus === 'IN_STOCK').length;
      const lowStockCount = list.filter((i) => i.stockStatus === 'LOW_STOCK').length;
      const outOfStockCount = list.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;

      if (args?.status) {
        list = list.filter((item) => item.stockStatus === args.status);
      }

      if (args?.search) {
        const q = args.search.toLowerCase().trim();
        list = list.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.slug.toLowerCase().includes(q)
        );
      }

      const filteredCount = list.length;
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);

      return {
        items: list,
        total: filteredCount,
        stats: {
          totalProducts: totalCount,
          inStockCount,
          lowStockCount,
          outOfStockCount,
        },
      };
    },

    async updateStock(
      productId: string,
      stockQuantity: number,
      lowStockThreshold?: number,
      adminUser?: { id: string; email: string }
    ) {
      if (stockQuantity < 0) {
        throw new Error('Stock quantity cannot be negative.');
      }
      if (lowStockThreshold !== undefined && lowStockThreshold < 0) {
        throw new Error('Low stock threshold cannot be negative.');
      }

      const state = readDb();
      const index = state.products.findIndex((p) => p.id === productId);
      if (index === -1) throw new Error('Product not found in inventory.');

      const product = state.products[index];
      const prevStock = product.stockQuantity;
      product.stockQuantity = stockQuantity;
      if (lowStockThreshold !== undefined) {
        product.lowStockThreshold = lowStockThreshold;
      }

      if (stockQuantity === 0 && product.status === 'PUBLISHED') {
        product.status = 'OUT_OF_STOCK';
      } else if (stockQuantity > 0 && product.status === 'OUT_OF_STOCK') {
        product.status = 'PUBLISHED';
      }

      product.updatedAt = new Date().toISOString();
      writeDb(state);

      if (adminUser) {
        await db.auditLog.create({
          data: {
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: 'STOCK_UPDATED',
            targetType: 'PRODUCT',
            targetId: product.id,
            targetName: product.title,
            details: `Inventory stock adjusted from ${prevStock} to ${stockQuantity} (threshold: ${product.lowStockThreshold ?? 5})`,
          },
        });
      }

      return product;
    },

    async bulkUpdateStock(
      updates: Array<{ id: string; stockQuantity: number; lowStockThreshold?: number }>,
      adminUser?: { id: string; email: string }
    ) {
      for (const u of updates) {
        if (u.stockQuantity < 0) {
          throw new Error(`Stock quantity for item ${u.id} cannot be negative.`);
        }
      }

      const state = readDb();
      let updatedCount = 0;

      for (const u of updates) {
        const index = state.products.findIndex((p) => p.id === u.id);
        if (index > -1) {
          state.products[index].stockQuantity = u.stockQuantity;
          if (u.lowStockThreshold !== undefined) {
            state.products[index].lowStockThreshold = u.lowStockThreshold;
          }
          if (u.stockQuantity === 0 && state.products[index].status === 'PUBLISHED') {
            state.products[index].status = 'OUT_OF_STOCK';
          } else if (u.stockQuantity > 0 && state.products[index].status === 'OUT_OF_STOCK') {
            state.products[index].status = 'PUBLISHED';
          }
          state.products[index].updatedAt = new Date().toISOString();
          updatedCount++;
        }
      }

      writeDb(state);

      if (adminUser && updatedCount > 0) {
        await db.auditLog.create({
          data: {
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: 'STOCK_BULK_UPDATED',
            targetType: 'PRODUCT',
            targetId: 'multiple',
            targetName: `${updatedCount} Products`,
            details: `Bulk inventory update modified ${updatedCount} products`,
          },
        });
      }

      return { success: true, updatedCount };
    },
  },

  analytics: {
    async getSalesAnalytics(period: 'today' | '7d' | '30d' | '90d' | 'all' = '30d') {
      const state = readDb();
      const now = Date.now();
      let startTime = 0;

      if (period === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        startTime = startOfToday.getTime();
      } else if (period === '7d') {
        startTime = now - 7 * 24 * 60 * 60 * 1000;
      } else if (period === '30d') {
        startTime = now - 30 * 24 * 60 * 60 * 1000;
      } else if (period === '90d') {
        startTime = now - 90 * 24 * 60 * 60 * 1000;
      } else {
        startTime = 0;
      }

      const validOrders = state.orders.filter((o) => {
        const isPaid =
          o.paymentStatus === 'PAID' ||
          o.status === OrderStatus.DELIVERED ||
          o.status === OrderStatus.CONFIRMED ||
          o.status === OrderStatus.PROCESSING;
        const isNotCancelled = o.status !== OrderStatus.CANCELLED;
        const matchesTime = new Date(o.createdAt).getTime() >= startTime;
        return isPaid && isNotCancelled && matchesTime;
      });

      const totalRevenue = Math.round(validOrders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0) * 100) / 100;
      const totalOrders = validOrders.length;
      const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

      let productsSold = 0;
      const productSalesMap: Record<string, { unitsSold: number; revenue: number; title: string; sku: string | null; coverImageUrl: string }> = {};

      for (const order of validOrders) {
        if (order.items) {
          for (const item of order.items) {
            productsSold += item.quantity;
            if (!productSalesMap[item.productId]) {
              const prod = state.products.find((p) => p.id === item.productId);
              productSalesMap[item.productId] = {
                unitsSold: 0,
                revenue: 0,
                title: item.productTitle || prod?.title || 'Unknown Product',
                sku: item.sku || prod?.sku || null,
                coverImageUrl: prod?.coverImageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
              };
            }
            productSalesMap[item.productId].unitsSold += item.quantity;
            productSalesMap[item.productId].revenue += (item.priceAtPurchase || 0) * item.quantity;
          }
        }
      }

      const topProducts = Object.entries(productSalesMap)
        .map(([id, data]) => ({
          id,
          title: data.title,
          sku: data.sku,
          coverImageUrl: data.coverImageUrl,
          unitsSold: data.unitsSold,
          revenue: Math.round(data.revenue * 100) / 100,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const uniqueCustomerIds = new Set(validOrders.map((o) => o.buyerId));
      const totalCustomers = uniqueCustomerIds.size;

      const bucketCount = period === 'today' ? 12 : period === '7d' ? 7 : period === '30d' ? 15 : 12;
      const timeSeries: Array<{ date: string; label: string; revenue: number; orders: number; unitsSold: number }> = [];

      const duration = now - startTime;
      const step = duration / bucketCount;

      for (let i = 0; i < bucketCount; i++) {
        const bucketStart = startTime + i * step;
        const bucketEnd = bucketStart + step;
        const bucketOrders = validOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= bucketStart && t < bucketEnd;
        });

        const bRev = Math.round(bucketOrders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0) * 100) / 100;
        const bUnits = bucketOrders.reduce((sum, o) => sum + (o.items ? o.items.reduce((acc, it) => acc + it.quantity, 0) : 0), 0);

        const d = new Date(bucketStart);
        const label = period === 'today'
          ? `${d.getHours()}:00`
          : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

        timeSeries.push({
          date: d.toISOString(),
          label,
          revenue: bRev,
          orders: bucketOrders.length,
          unitsSold: bUnits,
        });
      }

      return {
        period,
        summary: {
          revenue: totalRevenue,
          orders: totalOrders,
          averageOrderValue,
          productsSold,
          customers: totalCustomers,
        },
        timeSeries,
        topProducts,
      };
    },
  },

  settings: {
    async getSettings(): Promise<StoreSettingsMap & { paymentStatus: { razorpayConfigured: boolean; stripeConfigured: boolean; codEnabled: boolean } }> {
      const state = readDb();
      return {
        ...state.settings,
        paymentStatus: {
          razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
          stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
          codEnabled: true,
        },
      };
    },

    async updateSettings(data: Partial<StoreSettingsMap>, adminUser?: { id: string; email: string }) {
      const state = readDb();
      state.settings = {
        ...state.settings,
        ...data,
      };
      writeDb(state);

      if (adminUser) {
        await db.auditLog.create({
          data: {
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            action: 'SETTINGS_UPDATED',
            targetType: 'CATEGORY',
            targetId: 'store_settings',
            targetName: 'Store Settings',
            details: `Updated settings: ${Object.keys(data).join(', ')}`,
          },
        });
      }

      return state.settings;
    },
  },

  search: {
    async globalSearch(query: string) {
      const state = readDb();
      const q = query.toLowerCase().trim();
      if (!q) return { products: [], orders: [], customers: [] };

      const products = state.products
        .filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            p.slug.toLowerCase().includes(q)
        )
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          title: p.title,
          sku: p.sku,
          price: p.price,
          stock: p.stockQuantity,
          status: p.status,
          coverImageUrl: p.coverImageUrl,
        }));

      const orders = state.orders
        .filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            (o.buyerEmail && o.buyerEmail.toLowerCase().includes(q)) ||
            (o.buyerName && o.buyerName.toLowerCase().includes(q))
        )
        .slice(0, 5)
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          buyerName: o.buyerName || o.buyerEmail || 'Customer',
          totalAmount: o.totalAmount ?? o.total ?? 0,
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        }));

      const customers = state.users
        .filter(
          (u) =>
            u.role === Role.BUYER &&
            (u.email.toLowerCase().includes(q) ||
              (u.name && u.name.toLowerCase().includes(q)) ||
              (u.phone && u.phone.toLowerCase().includes(q)))
        )
        .slice(0, 5)
        .map((u) => ({
          id: u.id,
          name: u.name || 'Unnamed',
          email: u.email,
          phone: u.phone,
          status: u.status,
          createdAt: u.createdAt,
        }));

      return { products, orders, customers };
    },
  },

  coupon: {
    async findMany(args?: { where?: { isActive?: boolean; search?: string } }): Promise<StoredCoupon[]> {
      const state = readDb();
      let list = [...(state.coupons || [])];
      if (args?.where) {
        if (args.where.isActive !== undefined) {
          list = list.filter((c) => c.isActive === args.where!.isActive);
        }
        if (args.where.search) {
          const q = args.where.search.toLowerCase().trim();
          list = list.filter((c) => c.code.toLowerCase().includes(q));
        }
      }
      return list;
    },

    async findUnique(args: { where: { id?: string; code?: string } }): Promise<StoredCoupon | null> {
      const state = readDb();
      if (args.where.id) {
        return (state.coupons || []).find((c) => c.id === args.where.id) || null;
      }
      if (args.where.code) {
        return (state.coupons || []).find((c) => c.code.toUpperCase() === args.where.code!.toUpperCase()) || null;
      }
      return null;
    },

    async create(
      data: {
        code: string;
        discountType: 'PERCENTAGE' | 'FIXED';
        discountValue: number;
        minOrderAmount?: number | null;
        maxDiscount?: number | null;
        startDate?: string | null;
        expiryDate?: string | null;
        usageLimit?: number | null;
        perCustomerLimit?: number | null;
        isActive?: boolean;
      },
      adminMeta?: { adminId: string; adminEmail: string }
    ): Promise<StoredCoupon> {
      const state = readDb();
      const codeUpper = data.code.trim().toUpperCase();

      if ((state.coupons || []).some((c) => c.code === codeUpper)) {
        throw new Error(`Coupon with code "${codeUpper}" already exists.`);
      }

      if (data.discountValue <= 0) {
        throw new Error('Discount value must be greater than zero.');
      }

      if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
        throw new Error('Percentage discount cannot exceed 100%.');
      }

      const coupon: StoredCoupon = {
        id: generateId('cpn'),
        code: codeUpper,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : null,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
        startDate: data.startDate || null,
        expiryDate: data.expiryDate || null,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        usageCount: 0,
        perCustomerLimit: data.perCustomerLimit ? Number(data.perCustomerLimit) : 1,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.coupons = state.coupons || [];
      state.coupons.unshift(coupon);
      writeDb(state);

      if (adminMeta) {
        await db.auditLog.create({
          data: {
            adminId: adminMeta.adminId,
            adminEmail: adminMeta.adminEmail,
            action: 'COUPON_CREATED',
            targetType: 'COUPON',
            targetId: coupon.id,
            targetName: coupon.code,
            details: `Created coupon ${coupon.code} (${coupon.discountType}: ${coupon.discountValue})`,
          },
        });
      }

      return coupon;
    },

    async update(
      id: string,
      data: Partial<StoredCoupon>,
      adminMeta?: { adminId: string; adminEmail: string }
    ): Promise<StoredCoupon> {
      const state = readDb();
      const index = (state.coupons || []).findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error('Coupon not found.');
      }

      const existing = state.coupons[index];
      if (data.code && data.code.trim().toUpperCase() !== existing.code) {
        const codeUpper = data.code.trim().toUpperCase();
        if (state.coupons.some((c) => c.id !== id && c.code === codeUpper)) {
          throw new Error(`Another coupon with code "${codeUpper}" already exists.`);
        }
        existing.code = codeUpper;
      }

      if (data.discountValue !== undefined) {
        if (data.discountValue <= 0) throw new Error('Discount value must be greater than zero.');
        existing.discountValue = Number(data.discountValue);
      }
      if (data.discountType !== undefined) existing.discountType = data.discountType;
      if (data.minOrderAmount !== undefined) existing.minOrderAmount = data.minOrderAmount ? Number(data.minOrderAmount) : null;
      if (data.maxDiscount !== undefined) existing.maxDiscount = data.maxDiscount ? Number(data.maxDiscount) : null;
      if (data.startDate !== undefined) existing.startDate = data.startDate;
      if (data.expiryDate !== undefined) existing.expiryDate = data.expiryDate;
      if (data.usageLimit !== undefined) existing.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
      if (data.perCustomerLimit !== undefined) existing.perCustomerLimit = data.perCustomerLimit ? Number(data.perCustomerLimit) : null;
      if (data.isActive !== undefined) existing.isActive = Boolean(data.isActive);
      existing.updatedAt = new Date().toISOString();

      state.coupons[index] = existing;
      writeDb(state);

      if (adminMeta) {
        await db.auditLog.create({
          data: {
            adminId: adminMeta.adminId,
            adminEmail: adminMeta.adminEmail,
            action: 'COUPON_UPDATED',
            targetType: 'COUPON',
            targetId: existing.id,
            targetName: existing.code,
            details: `Updated coupon ${existing.code}`,
          },
        });
      }

      return existing;
    },

    async delete(id: string, adminMeta?: { adminId: string; adminEmail: string }): Promise<void> {
      const state = readDb();
      const coupon = (state.coupons || []).find((c) => c.id === id);
      if (!coupon) throw new Error('Coupon not found.');

      state.coupons = (state.coupons || []).filter((c) => c.id !== id);
      writeDb(state);

      if (adminMeta) {
        await db.auditLog.create({
          data: {
            adminId: adminMeta.adminId,
            adminEmail: adminMeta.adminEmail,
            action: 'COUPON_DELETED',
            targetType: 'COUPON',
            targetId: coupon.id,
            targetName: coupon.code,
            details: `Deleted coupon ${coupon.code}`,
          },
        });
      }
    },

    async validateCoupon(
      code: string,
      subtotal: number,
      userId?: string
    ): Promise<{
      valid: boolean;
      coupon?: StoredCoupon;
      discount: number;
      error?: string;
    }> {
      const state = readDb();
      if (!code || typeof code !== 'string') {
        return { valid: false, discount: 0, error: 'Coupon code is required.' };
      }

      const coupon = (state.coupons || []).find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
      if (!coupon) {
        return { valid: false, discount: 0, error: 'Invalid coupon code.' };
      }

      if (!coupon.isActive) {
        return { valid: false, discount: 0, error: 'This coupon is no longer active.' };
      }

      const now = new Date();
      if (coupon.startDate && new Date(coupon.startDate) > now) {
        return { valid: false, discount: 0, error: 'This coupon has not started yet.' };
      }

      if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
        return { valid: false, discount: 0, error: 'This coupon has expired.' };
      }

      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return {
          valid: false,
          discount: 0,
          error: `Minimum order amount of ₹${coupon.minOrderAmount} required to use this coupon.`,
        };
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return { valid: false, discount: 0, error: 'This coupon has reached its maximum global usage limit.' };
      }

      if (userId && coupon.perCustomerLimit) {
        const userCount = (state.couponUsages || []).filter(
          (u) => u.couponId === coupon.id && u.userId === userId
        ).length;
        if (userCount >= coupon.perCustomerLimit) {
          return {
            valid: false,
            discount: 0,
            error: `You have already used this coupon the maximum allowed number of times (${coupon.perCustomerLimit}).`,
          };
        }
      }

      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        const raw = (subtotal * coupon.discountValue) / 100;
        discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
      } else {
        discount = Math.min(coupon.discountValue, subtotal);
      }
      discount = Math.max(0, Math.min(discount, subtotal));
      discount = Math.round(discount * 100) / 100;

      return { valid: true, coupon, discount };
    },
  },

  notification: {
    async create(data: {
      userId: string;
      title: string;
      message: string;
      type: string;
      link?: string | null;
    }): Promise<StoredNotification> {
      const state = readDb();
      const notification: StoredNotification = {
        id: generateId('notif'),
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      state.notifications = state.notifications || [];
      state.notifications.unshift(notification);
      writeDb(state);
      return notification;
    },

    async findManyForUser(userId: string): Promise<StoredNotification[]> {
      const state = readDb();
      return (state.notifications || []).filter((n) => n.userId === userId);
    },

    async markAsRead(id: string, userId: string): Promise<StoredNotification | null> {
      const state = readDb();
      const notif = (state.notifications || []).find((n) => n.id === id && n.userId === userId);
      if (!notif) return null;
      notif.isRead = true;
      writeDb(state);
      return notif;
    },

    async markAllAsRead(userId: string): Promise<void> {
      const state = readDb();
      (state.notifications || [])
        .filter((n) => n.userId === userId)
        .forEach((n) => (n.isRead = true));
      writeDb(state);
    },
  },

  stats: {
    async getDashboardTelemetry() {
      const state = readDb();
      const now = Date.now();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayTime = startOfToday.getTime();
      const weekTime = now - 7 * 24 * 60 * 60 * 1000;
      const monthTime = now - 30 * 24 * 60 * 60 * 1000;

      const isPaidOrder = (o: StoredOrder) =>
        (o.paymentStatus === 'PAID' ||
          o.status === OrderStatus.DELIVERED ||
          o.status === OrderStatus.CONFIRMED ||
          o.status === OrderStatus.PROCESSING) &&
        o.status !== OrderStatus.CANCELLED;

      const paidOrders = state.orders.filter(isPaidOrder);

      const todaySales = paidOrders
        .filter((o) => new Date(o.createdAt).getTime() >= todayTime)
        .reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);

      const weekSales = paidOrders
        .filter((o) => new Date(o.createdAt).getTime() >= weekTime)
        .reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);

      const monthSales = paidOrders
        .filter((o) => new Date(o.createdAt).getTime() >= monthTime)
        .reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);

      const totalSales = paidOrders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);

      const totalOrders = state.orders.length;
      const pendingOrders = state.orders.filter((o) => o.status === OrderStatus.PENDING_PAYMENT).length;
      const processingOrders = state.orders.filter(
        (o) => o.status === OrderStatus.PROCESSING || o.status === OrderStatus.CONFIRMED
      ).length;
      const completedOrders = state.orders.filter((o) => o.status === OrderStatus.DELIVERED).length;
      const cancelledOrders = state.orders.filter((o) => o.status === OrderStatus.CANCELLED).length;

      const totalProducts = state.products.length;
      const publishedProducts = state.products.filter((p) => p.status === 'PUBLISHED' && p.isActive).length;
      const draftProducts = state.products.filter((p) => p.status === 'DRAFT').length;
      const outOfStockProducts = state.products.filter((p) => p.stockQuantity <= 0 || p.status === 'OUT_OF_STOCK').length;
      const lowStockProducts = state.products.filter(
        (p) => p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold ?? 5)
      ).length;

      const buyers = state.users.filter((u) => u.role === Role.BUYER);
      const totalBuyers = buyers.length;
      const newBuyers = buyers.filter((b) => new Date(b.createdAt).getTime() >= monthTime).length;
      const returningBuyers = buyers.filter((b) => {
        const userOrderCount = state.orders.filter((o) => o.buyerId === b.id).length;
        return userOrderCount > 1;
      }).length;

      return {
        sales: {
          today: Math.round(todaySales * 100) / 100,
          week: Math.round(weekSales * 100) / 100,
          month: Math.round(monthSales * 100) / 100,
          total: Math.round(totalSales * 100) / 100,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        products: {
          total: totalProducts,
          published: publishedProducts,
          draft: draftProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts,
        },
        customers: {
          total: totalBuyers,
          newBuyers,
          returningBuyers,
        },
        recentOrders: state.orders.slice(0, 5),
        recentActivity: state.auditLogs.slice(0, 6),
      };
    },
  },
};
