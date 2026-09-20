import { NextRequest } from 'next/server';
import { kioskService } from '@/lib/kioskService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> | { deviceId: string } }
) {
  try {
    const { deviceId } = await Promise.resolve(context.params);
    const body = await request.json();
    const targetUrl = body.kioskUrl || body.url;

    if (!deviceId) {
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    if (!targetUrl || typeof targetUrl !== 'string') {
      return jsonWithCors(
        {
          success: false,
          error: 'kioskUrl or url string field is required',
        },
        { status: 400 }
      );
    }

    const result = await kioskService.updateKioskUrl(deviceId, targetUrl);

    return jsonWithCors({
      success: true,
      data: {
        deviceId: result.deviceId,
        kioskUrl: result.kioskUrl,
        url: result.url,
      },
    });
  } catch (error) {
    console.error('Error updating kiosk url:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to update kiosk url',
      },
      { status: 500 }
    );
  }
}
