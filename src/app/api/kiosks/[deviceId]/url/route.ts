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
    const targetUrl = body.kioskUrl || body.url;

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'kioskUrl or url string field is required',
        },
        { status: 400 }
      );
    }

    const result = await kioskService.updateKioskUrl(deviceId, targetUrl);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: result.deviceId,
        kioskUrl: result.kioskUrl,
        url: result.url,
      },
    });
  } catch (error) {
    console.error('Error updating kiosk url:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update kiosk url',
      },
      { status: 500 }
    );
  }
}

