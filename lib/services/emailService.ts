/**
 * Email Service
 * Handles transactional emails (password reset, verification, order confirmation)
 * Requires email service integration (SendGrid, Mailgun, or Firebase Functions)
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send password reset email
 * This calls your backend API which handles the actual email sending
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  try {
    const response = await fetch('/api/email/send-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        resetLink,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
  try {
    const response = await fetch('/api/email/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        verificationLink,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: {
    orderId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress: string;
  }
): Promise<void> {
  try {
    const response = await fetch('/api/email/send-order-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        orderDetails,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
}

/**
 * Send deposit confirmation email
 */
export async function sendDepositConfirmationEmail(
  email: string,
  depositDetails: {
    amount: number;
    reference: string;
    timestamp: Date;
  }
): Promise<void> {
  try {
    const response = await fetch('/api/email/send-deposit-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        depositDetails: {
          ...depositDetails,
          timestamp: depositDetails.timestamp.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending deposit confirmation email:', error);
    throw error;
  }
}

/**
 * Generic email sending function for custom emails
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
