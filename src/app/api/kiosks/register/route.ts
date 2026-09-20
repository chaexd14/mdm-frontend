import { NextRequest } from 'next/server';
import { kioskService } from '@/lib/kioskService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deviceId,
      deviceName,
      name,
      os,
      agentVersion,
      appVersion,
      location,
      url,
      kioskUrl,
      batteryLevel,
      isCharging,
      isDeviceOwner,
      lockTaskState,
      model,
      manufacturer,
    } = body;

    if (!deviceId) {
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const result = await kioskService.registerKiosk({
      deviceId,
      deviceName,
      name,
      os,
      agentVersion,
      appVersion,
      location,
      url,
      kioskUrl,
      batteryLevel,
      isCharging,
      isDeviceOwner,
      lockTaskState,
      model,
      manufacturer,
    });

    return jsonWithCors({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error registering kiosk:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to register kiosk',
      },
      { status: 500 }
    );
  }
}
