import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { encryptDigitalKey } from '@/lib/crypto-vault';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    const { keys } = body;
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least one key string.' },
        { status: 400 }
      );
    }

    const validRawKeys = keys
      .map((k) => (typeof k === 'string' ? k.trim() : ''))
      .filter((k) => k.length > 0);

    if (validRawKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No non-empty serial keys were submitted.' },
        { status: 400 }
      );
    }

    // Encrypt each digital key using AES-256-GCM
    const keyData = validRawKeys.map((rawKey) => {
      const encrypted = encryptDigitalKey(rawKey);
      return {
        productId: product.id,
        cipherText: encrypted.cipherText,
        iv: encrypted.iv,
        tag: encrypted.tag,
      };
    });

    await db.productKey.createMany({ data: keyData });

    // Sync stock quantity
    const newStockQuantity = (product.stockQuantity || 0) + validRawKeys.length;
    await db.product.update({
      where: { id: product.id },
      data: { stockQuantity: newStockQuantity },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.userId,
        adminEmail: admin.email,
        action: 'INVENTORY_KEYS_INGESTED',
        targetType: 'PRODUCT',
        targetId: product.id,
        targetName: product.title,
        details: `Ingested ${validRawKeys.length} encrypted keys. New stock level: ${newStockQuantity}`,
      },
    });

    const updatedStats = await db.productKey.countStats(product.id);

    return NextResponse.json({
      success: true,
      message: `Successfully ingested and encrypted ${validRawKeys.length} digital keys.`,
      addedCount: validRawKeys.length,
      newStockQuantity,
      vaultStats: updatedStats,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Admin keys ingest error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
