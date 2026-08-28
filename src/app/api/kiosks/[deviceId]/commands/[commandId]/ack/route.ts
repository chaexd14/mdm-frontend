import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: {
    params:
      | Promise<{ deviceId: string; commandId: string }>
      | { deviceId: string; commandId: string };
  }
) {
  try {
    const { deviceId, commandId } = await Promise.resolve(context.params);
    let status = 'executed';

    try {
      const body = await request.json();
      if (body?.status) {
        status = body.status;
      }
    } catch {
      // Body might be empty, default to 'executed'
    }

    if (!deviceId || !commandId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId and commandId are required',
        },
        { status: 400 }
      );
    }

    await kioskService.acknowledgeCommand(deviceId, commandId, status);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error acknowledging command:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to acknowledge command',
      },
      { status: 500 }
    );
  }
}
