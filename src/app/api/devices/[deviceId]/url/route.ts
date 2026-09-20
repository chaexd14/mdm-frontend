import { NextRequest } from 'next/server';
import { deviceService } from '@/lib/deviceService';
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
    const targetUrl = body.targetUrl || body.kioskUrl || body.url;

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
          error: 'targetUrl, kioskUrl or url string field is required',
        },
        { status: 400 }
      );
    }

    const result = await deviceService.updateDeviceUrl(deviceId, targetUrl);

    return jsonWithCors({
      success: true,
      data: {
        deviceId: result.deviceId,
        targetUrl: result.targetUrl,
        kioskUrl: result.kioskUrl,
        url: result.url,
      },
    });
  } catch (error) {
    console.error('Error updating device url:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to update device url',
      },
      { status: 500 }
    );
  }
}
