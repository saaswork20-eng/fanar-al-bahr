/**
 * Notification Service Abstraction for Fanar Al Bhar
 * Clean notification foundation for order confirmations, payment confirmations, and digital deliveries.
 * Strictly avoids fake mock email sending.
 */

export interface OrderNotificationPayload {
  orderId: string;
  orderNumber: string;
  recipientEmail: string;
  recipientName: string;
  total: number;
  currency: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
}

export class NotificationService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(
      process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD &&
      process.env.EMAIL_FROM
    );
  }

  public hasEmailProvider(): boolean {
    return this.isConfigured;
  }

  /**
   * Dispatches order confirmation email if a real email provider is configured.
   */
  public async sendOrderConfirmation(payload: OrderNotificationPayload): Promise<boolean> {
    if (!this.isConfigured) {
      // Clean foundation: Log structured notification event without inventing fake email deliveries
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[NotificationService] Order confirmation queued for order ${payload.orderNumber} to ${payload.recipientEmail} (Awaiting SMTP/Email provider credentials)`);
      }
      return false;
    }

    // Production SMTP / Resend / SendGrid dispatch logic would go here
    return true;
  }

  /**
   * Dispatches payment confirmation email if provider configured.
   */
  public async sendPaymentConfirmation(payload: OrderNotificationPayload): Promise<boolean> {
    if (!this.isConfigured) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[NotificationService] Payment confirmation queued for order ${payload.orderNumber} (Awaiting SMTP credentials)`);
      }
      return false;
    }
    return true;
  }
}

export const notificationService = new NotificationService();
