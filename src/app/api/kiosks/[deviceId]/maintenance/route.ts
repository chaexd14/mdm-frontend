import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> | { deviceId: string } }
) {
  try {
    const { deviceId } = await Promise.resolve(context.params);
    const body = await request.json();
    const { enabled, message } = body;

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'enabled boolean field is required',
        },
        { status: 400 }
      );
    }

    const result = await kioskService.setMaintenanceMode(deviceId, enabled, message);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update maintenance mode',
      },
      { status: 500 }
    );
  }
}
