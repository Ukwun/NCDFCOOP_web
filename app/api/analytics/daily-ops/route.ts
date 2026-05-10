import { NextRequest, NextResponse } from 'next/server';
import { ServerCommerceIntelligenceService } from '@/lib/services/serverCommerceIntelligenceService';

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.COMMERCE_INTELLIGENCE_CRON_TOKEN;
  if (!expected) return false;

  const authHeader = request.headers.get('authorization') || '';
  return authHeader === `Bearer ${expected}`;
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Daily commerce intelligence endpoint is active',
      requiresAuth: true,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const summary = await ServerCommerceIntelligenceService.runDailyAggregation();

    return NextResponse.json(
      {
        success: true,
        summary,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to run daily aggregation',
      },
      { status: 500 }
    );
  }
}
