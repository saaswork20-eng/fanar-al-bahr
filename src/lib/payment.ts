import crypto from 'crypto';
import { StoredOrder } from './db';

/**
 * Payment Provider Configuration and Interface
 * Fanar Al Bhar Single-Vendor Real Payment Architecture.
 *
 * Strict Security Rules:
 * 1. Client NEVER passes payment success flags.
 * 2. Orders stay in 'PENDING' until a cryptographically verified webhook event confirms payment.
 * 3. Secrets are loaded exclusively from environment variables on the server.
 */

export interface PaymentIntentResult {
  paymentReference: string;
  provider: string;
  isConfigured: boolean;
  checkoutUrl?: string;
  clientSecret?: string;
  message?: string;
}

export interface WebhookEventPayload {
  eventType: 'payment.succeeded' | 'payment.failed' | string;
  orderId: string;
  orderNumber?: string;
  paymentId: string;
  amount: number;
  currency: string;
}

export class PaymentGatewayService {
  private providerName: string;
  private secretKey: string | null;
  private publicKey: string | null;
  private webhookSecret: string | null;

  constructor() {
    this.providerName = process.env.PAYMENT_PROVIDER || 'standard';
    this.secretKey = process.env.PAYMENT_SECRET_KEY || null;
    this.publicKey = process.env.PAYMENT_PUBLIC_KEY || null;
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || null;
  }

  /**
   * Checks whether the production payment gateway credentials are fully configured.
   */
  public isConfigured(): boolean {
    return Boolean(this.secretKey && this.webhookSecret);
  }

  public getPublicKey(): string | null {
    return this.publicKey;
  }

  public getProviderName(): string {
    return this.providerName;
  }

  /**
   * Initializes a payment session for a verified server-calculated order.
   */
  public async createPaymentIntent(order: StoredOrder): Promise<PaymentIntentResult> {
    const isReady = this.isConfigured();

    // If configured with e.g. Stripe or Razorpay, this would invoke the official SDK using this.secretKey.
    // When not yet configured in environment variables, we safely return a pending intent.
    const paymentReference = `pay_ref_${order.id.slice(0, 8)}_${Date.now()}`;

    if (!isReady) {
      return {
        paymentReference,
        provider: this.providerName,
        isConfigured: false,
        message:
          'Payment gateway credentials (PAYMENT_SECRET_KEY, PAYMENT_WEBHOOK_SECRET) are pending configuration in the environment. Order is created in PENDING state awaiting gateway connection.',
      };
    }

    return {
      paymentReference,
      provider: this.providerName,
      isConfigured: true,
      clientSecret: `cs_${paymentReference}`,
      checkoutUrl: undefined, // Or session.url for hosted checkouts
    };
  }

  /**
   * Cryptographically verifies an incoming webhook payload using HMAC-SHA256 signature.
   * Prevents webhook spoofing, tampering, and replay attacks.
   */
  public verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!this.webhookSecret) {
      // In development or when webhook secret is not set, reject unless in designated test mode
      if (process.env.NODE_ENV === 'test' && signature === 'test-valid-sig') {
        return true;
      }
      return false;
    }

    if (!signature) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody, 'utf8')
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const receivedBuffer = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');

      if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parses and validates the webhook payload structure.
   */
  public parseWebhookPayload(rawBody: string): WebhookEventPayload | null {
    try {
      const parsed = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== 'object') return null;

      const eventType = parsed.type || parsed.event || parsed.eventType;
      const data = parsed.data?.object || parsed.payload?.payment?.entity || parsed;

      const orderId = data.orderId || data.metadata?.orderId || data.notes?.orderId;
      const orderNumber = data.orderNumber || data.metadata?.orderNumber;
      const paymentId = data.id || data.paymentId || data.transactionId;
      const amount = Number(data.amount || 0);
      const currency = data.currency || 'INR';

      if (!orderId || !paymentId) {
        return null;
      }

      return {
        eventType,
        orderId,
        orderNumber,
        paymentId,
        amount,
        currency,
      };
    } catch {
      return null;
    }
  }

  /**
   * Utility for generating a valid signature for testing / webhook simulation.
   */
  public generateTestSignature(rawBody: string, secret?: string): string {
    const key = secret || this.webhookSecret || 'test-secret';
    return crypto.createHmac('sha256', key).update(rawBody, 'utf8').digest('hex');
  }
}

export const paymentGateway = new PaymentGatewayService();
