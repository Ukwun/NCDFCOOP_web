# 💳 FLUTTERWAVE & BANK TRANSFER PAYMENT SETUP
## Complete Payment Configuration Guide

---

## ✅ YOUR FLUTTERWAVE KEYS ARE READY

The following test keys have been configured in `.env.local`:

```
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_test_3328123ad3e7bc829368f627963094733e5647b0
FLUTTERWAVE_SECRET_KEY=sk_test_7ffa54e85c90861976aad3b51f2c5ffbdb1bdd7c
```

---

## 🚀 PAYMENT METHODS ENABLED

Your platform now supports **2 payment methods**:

### 1. **Flutterwave** 💳
- Card payments (Visa, Mastercard)
- Mobile money (Airtel, MTN, Vodafone)
- USSD transfers
- Real-time payment processing
- Instant confirmation

### 2. **Bank Transfer** 🏦
- Manual bank transfer
- User submits proof of payment
- Account details provided in checkout
- Manual verification process

---

## 📱 HOW CUSTOMERS PAY

### **Flutterwave Payment Flow**

1. Customer adds items to cart
2. Goes to checkout
3. Fills shipping address
4. Selects **"Pay with Flutterwave"**
5. Clicks "Pay Now"
6. **Flutterwave popup appears**
7. Customer selects payment method:
   - Card (Visa/Mastercard)
   - Mobile money (MTN, Airtel, Vodafone)
   - USSD
8. Completes payment
9. **Instant confirmation** ✅
10. Order created immediately
11. Payment receipt sent

### **Bank Transfer Payment Flow**

1. Customer adds items to cart
2. Goes to checkout
3. Fills shipping address
4. Selects **"Bank Transfer"**
5. Clicks "Continue"
6. **Bank details displayed**:
   - Account Name
   - Account Number
   - Bank Name
   - Sort Code
7. Instructions to transfer funds
8. Submit proof of payment
9. Order pending until **manual verification** ✅
10. Payment verified
11. Order confirmed

---

## 🔑 YOUR BANK ACCOUNT DETAILS

When customers choose bank transfer, they'll see:

```
Account Name: NCDFCOOP Commerce
Account Number: 1234567890
Bank Name: First Bank Nigeria
Sort Code: 011
```

**⚠️ Update these with your actual bank details before going live!**

---

## 🧪 TESTING FLUTTERWAVE

### **Test with Card**

1. Go to checkout at http://localhost:3000/checkout
2. Fill shipping address
3. Select "Pay with Flutterwave"
4. Click "Pay Now"
5. Flutterwave popup appears
6. Select "Card"
7. Use test card details:

**Test Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/27)
CVV: Any 3 digits (e.g., 123)
OTP: 123456 (if prompted)
```

**Test Failed Payment:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Result: Payment will fail - allows testing error handling
```

### **Test with Mobile Money (Sandbox)**

1. Go to checkout
2. Select "Pay with Flutterwave"
3. Click "Pay Now"
4. Select "Mobile Money"
5. Choose network (MTN, Airtel, Vodafone)
6. Enter test phone number
7. Confirm payment

### **Test Bank Transfer**

1. Go to checkout
2. Fill shipping address
3. Select "Bank Transfer"
4. Click "Continue"
5. See bank details
6. Instructions to transfer funds
7. Submit proof of payment (image/document)
8. Order marked as pending
9. ** Manual verification required**

---

## 📊 PAYMENT FLOW ARCHITECTURE

```
Checkout Page
    ↓
[Select Payment Method]
    ├─→ Flutterwave (Card/Mobile)
    │       ↓
    │   [Flutterwave Popup Opens]
    │       ↓
    │   [Customer Pays]
    │       ↓
    │   [Instant Verification]
    │       ↓
    │   [Order Created] ✅
    │       ↓
    │   [Confirmation Email]
    │
    └─→ Bank Transfer
            ↓
        [Show Bank Details]
            ↓
        [Customer Transfers Funds]
            ↓
        [Customer Submits Proof]
            ↓
        [Admin Verifies] 👤
            ↓
        [Order Confirmed] ✅
            ↓
        [Confirmation Email]
```

---

## 💻 CODE EXAMPLES

### **Initiating Flutterwave Payment**

```typescript
import { initiateFlutterwavePayment } from '@/lib/services/paymentService';

const handleFlutterwavePayment = async () => {
  try {
    await initiateFlutterwavePayment(
      amount,           // in NGN (e.g., 10000)
      email,            // customer email
      userId,           // user ID
      fullName,         // customer name
      orderId,          // order ID
      async (reference) => {
        // Success callback
        console.log('Payment successful:', reference);
        // Redirect to order confirmation
      },
      (error) => {
        // Error callback
        console.error('Payment failed:', error);
        // Show error message
      }
    );
  } catch (error) {
    console.error('Payment initialization failed:', error);
  }
};
```

### **Recording Bank Transfer Intent**

```typescript
import { recordBankTransferIntent, getBankTransferDetails } from '@/lib/services/paymentService';

const handleBankTransfer = async () => {
  try {
    // Record that customer chose bank transfer
    const reference = await recordBankTransferIntent(
      amount,
      email,
      userId,
      fullName,
      orderId
    );
    
    // Get bank details to show customer
    const bankDetails = getBankTransferDetails();
    
    // Show to customer:
    console.log('Transfer to:', bankDetails.accountName);
    console.log('Account:', bankDetails.accountNumber);
    console.log('Bank:', bankDetails.bankName);
    console.log('Reference:', reference);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### **Verifying Bank Transfer Payment**

```typescript
import { completeBankTransferPayment } from '@/lib/services/paymentService';

const handleBankTransferVerification = async (paymentReference: string, proofUrl: string) => {
  try {
    await completeBankTransferPayment(
      paymentReference,
      proofUrl,
      userId,
      orderId
    );
    console.log('Bank transfer verified and completed');
  } catch (error) {
    console.error('Verification failed:', error);
  }
};
```

---

## ⚙️ PRODUCTION SETUP CHECKLIST

Before going live with real money, verify:

- [ ] Update bank account details with your actual account
- [ ] Get Flutterwave production keys from https://flutterwave.com
- [ ] Update `.env.local` with production keys
- [ ] Test complete payment flow multiple times
- [ ] Test with real test cards from Flutterwave docs
- [ ] Verify bank transfers work correctly
- [ ] Set up payment verification endpoint on backend
- [ ] Configure email notifications for payments
- [ ] Set up order confirmation emails
- [ ] Test failed payment scenarios
- [ ] Test payment timeout scenarios
- [ ] Document bank transfer process for customers
- [ ] Create admin dashboard for payment verification
- [ ] Set up payment dispute handling

---

## 🔒 SECURITY NOTES

1. **Secret Keys**: Never expose `FLUTTERWAVE_SECRET_KEY` in frontend code
2. **Verification**: Always verify payments on backend using secret key
3. **Bank Details**: Update with actual account details before launch
4. **Proof Files**: Store payment proofs securely in Firebase Storage
5. **PCI Compliance**: Flutterwave handles all card data (PCI compliant)
6. **HTTPS**: Always use HTTPS in production for payment pages

---

## 🆘 TROUBLESHOOTING

### **"Flutterwave script not loading"**
```
Check:
1. Internet connection is stable
2. Browser console (F12) for errors
3. .env.local has correct public key
4. Restart dev server
```

### **"Payment verification failed"**
```
Check:
1. Backend verification endpoint exists (/api/verify-flutterwave-payment)
2. Secret key is correct in .env.local
3. Transaction ID is passed correctly
4. Check Flutterwave dashboard for transaction status
```

### **"Bank transfer not showing in orders"**
```
Check:
1. Bank transfer option appears in checkout
2. Reference is generated when selecting bank transfer
3. Proof of payment file is uploaded
4. Firebase transaction record exists
5. Manual verification process is working
```

---

## 📞 FLUTTERWAVE SUPPORT

- **Website**: https://flutterwave.com
- **Docs**: https://developer.flutterwave.com
- **Dashboard**: https://dashboard.flutterwave.com
- **Support Email**: support@flutterwave.com

---

## 📋 ENVIRONMENT VARIABLES REFERENCE

```bash
# Flutterwave Keys (Required for Payment Processing)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_test_xxxxx
FLUTTERWAVE_SECRET_KEY=sk_test_xxxxx

# Bank Transfer Settings (Optional - customize before launch)
NEXT_PUBLIC_BANK_ACCOUNT_NAME=NCDFCOOP Commerce
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=1234567890
NEXT_PUBLIC_BANK_NAME=First Bank Nigeria
NEXT_PUBLIC_BANK_SORT_CODE=011
```

---

## ✨ YOU'RE READY TO ACCEPT PAYMENTS!

Your e-commerce platform now supports:
- ✅ Flutterwave card payments
- ✅ Mobile money transfers
- ✅ USSD transfers
- ✅ Bank transfers

**Next steps:**
1. Test payment flow locally
2. Verify both payment methods work
3. Get production keys when ready
4. Update bank account details
5. Go live!

---

**Payment processing is critical. Test thoroughly before accepting real payments!**
