import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, agentVersion, appVersion, timestamp } = body;

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const result = await kioskService.heartbeat({
      deviceId,
      agentVersion,
      appVersion,
      timestamp,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process heartbeat',
      },
      { status: 500 }
    );
  }
}
