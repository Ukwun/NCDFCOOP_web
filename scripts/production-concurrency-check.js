const fs = require('fs');
const crypto = require('crypto');
const admin = require('firebase-admin');

const credentialPath = process.env.FIREBASE_ADMIN_CREDENTIALS;
if (!credentialPath || !fs.existsSync(credentialPath)) throw new Error('FIREBASE_ADMIN_CREDENTIALS is required.');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(credentialPath, 'utf8'))) });
const db = admin.firestore();

async function main() {
  const suffix = crypto.randomUUID();
  const productRef = db.collection('_productionChecks').doc(`product-${suffix}`);
  const orderRef = db.collection('_productionChecks').doc(`order-${suffix}`);
  const paymentRef = db.collection('_productionChecks').doc(`payment-${suffix}`);
  await productRef.set({ stock: 7 });
  await orderRef.set({ productId: productRef.id, quantity: 3, inventoryReserved: true, inventoryReleased: false, paymentStatus: 'pending' });
  await paymentRef.set({ status: 'pending', completionCount: 0 });

  const release = () => db.runTransaction(async (tx) => {
    const [order, product] = await Promise.all([tx.get(orderRef), tx.get(productRef)]);
    if (order.data().inventoryReleased === true) return false;
    tx.update(productRef, { stock: Number(product.data().stock) + Number(order.data().quantity) });
    tx.update(orderRef, { inventoryReleased: true, inventoryReserved: false });
    return true;
  });
  const completePayment = () => db.runTransaction(async (tx) => {
    const payment = await tx.get(paymentRef);
    if (payment.data().status === 'completed') return false;
    tx.update(paymentRef, { status: 'completed', completionCount: admin.firestore.FieldValue.increment(1) });
    return true;
  });

  const [releaseResults, paymentResults] = await Promise.all([
    Promise.all(Array.from({ length: 50 }, release)),
    Promise.all(Array.from({ length: 100 }, completePayment)),
  ]);
  const [product, payment] = await Promise.all([productRef.get(), paymentRef.get()]);
  const passed = product.data().stock === 10 && releaseResults.filter(Boolean).length === 1 && payment.data().completionCount === 1 && paymentResults.filter(Boolean).length === 1;
  await Promise.all([productRef.delete(), orderRef.delete(), paymentRef.delete()]);
  if (!passed) throw new Error(`Concurrency check failed: stock=${product.data().stock}, releases=${releaseResults.filter(Boolean).length}, paymentCompletions=${payment.data().completionCount}`);
  console.log(JSON.stringify({ passed: true, concurrentInventoryReleases: 50, duplicatePaymentEvents: 100, finalStock: product.data().stock, paymentCompletions: payment.data().completionCount }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
