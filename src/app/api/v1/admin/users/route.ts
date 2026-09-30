import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { Role, AccountStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const roleParam = searchParams.get('role') as Role | null;
    const statusParam = searchParams.get('status') as AccountStatus | null;
    const searchParam = searchParams.get('search') || undefined;

    const users = await db.user.findMany({
      where: {
        role: roleParam || undefined,
        status: statusParam || undefined,
        search: searchParam,
      },
    });

    const sanitized = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      users: sanitized,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
