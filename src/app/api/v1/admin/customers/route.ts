import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { Role, AccountStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const statusParam = (searchParams.get('status') as AccountStatus) || undefined;
    const searchParam = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0;

    const result = await db.user.findManyWithStats({
      role: Role.BUYER,
      status: statusParam,
      search: searchParam,
      take: limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      customers: result.customers,
      total: result.total,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
