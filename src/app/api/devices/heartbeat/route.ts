import { NextRequest } from 'next/server';
import { deviceService } from '@/lib/deviceService';
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
      agentVersion,
      appVersion,
      timestamp,
      batteryLevel,
      isCharging,
      isDeviceOwner,
      lockTaskState,
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

    const result = await deviceService.recordHeartbeat({
      deviceId,
      agentVersion,
      appVersion,
      timestamp,
      batteryLevel,
      isCharging,
      isDeviceOwner,
      lockTaskState,
    });

    return jsonWithCors({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to process heartbeat',
      },
      { status: 500 }
    );
  }
}
