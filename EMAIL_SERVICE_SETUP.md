# Email Service Setup Guide

This guide explains how to set up email notifications for NCDF COOP Commerce Platform.

## Overview

The application sends three types of emails:
1. **Password Reset Emails** - User-initiated password recovery
2. **Email Verification** - New account activation
3. **Order Confirmations** - Order placed notifications
4. **Deposit Confirmations** - Savings deposit receipts

## Available Email Services

### Option 1: SendGrid (Recommended)

SendGrid is a reliable email service with a generous free tier.

#### Setup Steps:

1. **Create SendGrid Account**
   - Visit https://sendgrid.com
   - Sign up for a free account
   - Verify your domain or verify single sender

2. **Get API Key**
   - Go to Settings → API Keys
   - Create a new API Key
   - Copy the key (you'll only see it once)

3. **Configure in .env.local**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Update Email Handler**
   
   Edit `/app/api/email/send/route.ts`:
   
   ```typescript
   import sgMail from '@sendgrid/mail';
   
   if (process.env.SENDGRID_API_KEY) {
     sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   }
   
   export async function POST(request: NextRequest) {
     try {
       const { to, subject, html, text } = await request.json();
       
       await sgMail.send({
         to,
         from: process.env.SENDGRID_FROM_EMAIL || 'noreply@ncdfcoop.com',
         subject,
         html,
         text,
       });
       
       return NextResponse.json(
         { message: 'Email sent successfully' },
         { status: 200 }
       );
     } catch (error) {
       console.error('SendGrid error:', error);
       return NextResponse.json(
         { error: 'Failed to send email' },
         { status: 500 }
       );
     }
   }
   ```

5. **Install Dependency**
   ```bash
   npm install @sendgrid/mail
   ```

---

### Option 2: Mailgun

Mailgun offers flexible pricing and good deliverability.

#### Setup Steps:

1. **Create Mailgun Account**
   - Visit https://www.mailgun.com
   - Sign up and verify your domain
   - Enable sending from your domain

2. **Get API Credentials**
   - Go to Settings → API Keys
   - Copy your API Key

3. **Configure in .env.local**
   ```env
   MAILGUN_API_KEY=key-xxxxxxxxxxxxx
   MAILGUN_DOMAIN=mail.yourdomain.com
   ```

4. **Update Email Handler**
   
   Edit `/app/api/email/send/route.ts`:
   
   ```typescript
   import Mailgun from 'mailgun.js';
   import FormData from 'form-data';
   
   const mailgun = new Mailgun(FormData);
   const mg = mailgun.client({
     username: 'api',
     key: process.env.MAILGUN_API_KEY || '',
   });
   
   export async function POST(request: NextRequest) {
     try {
       const { to, subject, html, text } = await request.json();
       
       await mg.messages.create(
         process.env.MAILGUN_DOMAIN || 'mail.ncdfcoop.com',
         {
           from: 'NCDF COOP <noreply@mail.ncdfcoop.com>',
           to,
           subject,
           html,
           text,
         }
       );
       
       return NextResponse.json(
         { message: 'Email sent successfully' },
         { status: 200 }
       );
     } catch (error) {
       console.error('Mailgun error:', error);
       return NextResponse.json(
         { error: 'Failed to send email' },
         { status: 500 }
       );
     }
   }
   ```

5. **Install Dependencies**
   ```bash
   npm install mailgun.js form-data
   ```

---

### Option 3: Firebase Email (Advanced)

Use Firebase Cloud Functions with SMTP for email sending.

This requires setting up Firebase Cloud Functions, which is more complex. See Firebase documentation at: https://firebase.google.com/docs/functions

---

## Testing Email Sending

### 1. Manual API Test

Use curl or Postman to test the endpoint:

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email</p>",
    "text": "This is a test email"
  }'
```

### 2. Test Password Reset

```bash
curl -X POST http://localhost:3000/api/email/send-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "resetLink": "http://localhost:3000/reset?token=abc123"
  }'
```

### 3. Test Email Verification

```bash
curl -X POST http://localhost:3000/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "verificationLink": "http://localhost:3000/verify?token=abc123"
  }'
```

---

## Integration with Firebase Authentication

To send password reset emails:

1. **Update authContext.tsx**

```typescript
import { sendPasswordResetEmail } from '@/lib/services/emailService';

export async function resetPassword(email: string): Promise<void> {
  try {
    // Firebase sends default email - we can override it
    const resetLink = await firebase.auth().sendPasswordResetEmail(email);
    
    // Or better: generate custom reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset?email=${encodeURIComponent(email)}`;
    
    // Send custom email via our service
    await sendPasswordResetEmail(email, resetLink);
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw error;
  }
}
```

---

## Integration with Orders

Update `/lib/services/orderService.ts` to send confirmation emails:

```typescript
import { sendOrderConfirmationEmail } from '@/lib/services/emailService';

export async function createOrder(
  userId: string,
  items: CartItem[],
  total: number,
  userEmail: string
): Promise<string> {
  try {
    // Create order in Firestore...
    
    // Send confirmation email
    await sendOrderConfirmationEmail(userEmail, {
      orderId: newOrderId,
      items: items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      total,
      shippingAddress: 'from-order-data'
    });
    
    return newOrderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}
```

---

## Email Templates

All email templates are in:
- `/app/api/email/send-password-reset/route.ts`
- `/app/api/email/send-verification/route.ts`
- `/app/api/email/send-order-confirmation/route.ts`
- `/app/api/email/send-deposit-confirmation/route.ts`

You can customize these templates by:
1. Editing the HTML in the route handlers
2. Adding company logo/branding
3. Changing colors and styling
4. Adding additional information

---

## Security Best Practices

1. **Never commit API keys** - Always use environment variables
2. **Validate email addresses** - Use the inputValidation utilities
3. **Rate limit emails** - Prevent spam/abuse by throttling email attempts
4. **Log emails** - Track sent emails for debugging
5. **Use HTTPS** - Ensure all connections are encrypted
6. **Verify domains** - Properly configure SPF, DKIM, DMARC records

---

## Troubleshooting

### "Failed to send email" Error

1. Check API key is correct in `.env.local`
2. Verify environment variables are loaded
3. Check email address is valid
4. Review server logs for detailed error messages

### Emails Not Receiving

1. Check spam/junk folder
2. Verify email domain is configured correctly
3. Check SendGrid/Mailgun dashboard for delivery status
4. Ensure "from" email is verified
5. Check SPF/DKIM/DMARC records

### Rate Limiting Issues

If receiving rate limit errors:
- Wait a few moments and retry
- For production, implement exponential backoff
- Consider upgrading email service plan

---

## Next Steps

1. Choose your preferred email service (SendGrid recommended)
2. Create account and get API key
3. Update `.env.local` with credentials
4. Update `/app/api/email/send/route.ts` with service code
5. Install required npm packages
6. Test email sending with curl
7. Deploy to production

For questions, refer to your email service's documentation:
- SendGrid: https://docs.sendgrid.com/
- Mailgun: https://documentation.mailgun.com/
- Firebase: https://firebase.google.com/docs
