import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { NextRequest, NextResponse } from 'next/server';
import { USER_ROLES } from '@/lib/constants/database';
import { getAdminApp } from '@/lib/firebase/admin';
import { hasRole, verifyRequestUser } from '@/lib/server/requestAuth';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

async function requireSeller(request: NextRequest) {
  const user = await verifyRequestUser(request);
  return hasRole(user, USER_ROLES.SELLER) ? user : null;
}

function productImageBucket() {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) throw new Error('STORAGE_BUCKET_NOT_CONFIGURED');
  return {
    bucketName,
    bucket: getStorage(getAdminApp()).bucket(bucketName),
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) {
      return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const image = formData.get('image');
    if (!image || typeof image === 'string' || typeof image.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Choose a product image to upload.' }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return NextResponse.json({ error: 'Upload a JPG, PNG, WEBP, or GIF image.' }, { status: 400 });
    }
    if (image.size < 1 || image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'The image must be 5 MB or smaller.' }, { status: 400 });
    }

    const { bucketName, bucket } = productImageBucket();
    const extension = image.type === 'image/jpeg'
      ? 'jpg'
      : image.type.split('/')[1];
    const objectPath = `product-images/${user!.uid}/${Date.now()}_${randomUUID()}.${extension}`;
    const downloadToken = randomUUID();
    await bucket.file(objectPath).save(Buffer.from(await image.arrayBuffer()), {
      resumable: false,
      metadata: {
        contentType: image.type,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
    return NextResponse.json({ success: true, url, path: objectPath }, { status: 201 });
  } catch (error) {
    console.error('Seller product image upload failed:', error);
    return NextResponse.json(
      { error: 'The product image could not be uploaded. Please retry.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) {
      return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    }
    const path = String((await request.json().catch(() => ({}))).path || '');
    if (!path.startsWith(`product-images/${user.uid}/`) || path.includes('..')) {
      return NextResponse.json({ error: 'Invalid product image path.' }, { status: 400 });
    }
    await productImageBucket().bucket.file(path).delete({ ignoreNotFound: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seller product image deletion failed:', error);
    return NextResponse.json({ error: 'The product image could not be removed.' }, { status: 500 });
  }
}
