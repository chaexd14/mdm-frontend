import { NextRequest } from 'next/server';
import { deviceService } from '@/lib/deviceService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ deviceId: string }> | { deviceId: string } }
) {
  try {
    const { deviceId } = await Promise.resolve(context.params);

    if (!deviceId) {
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const config = await deviceService.getDeviceConfig(deviceId);

    if (!config) {
      return jsonWithCors(
        {
          success: false,
          error: `Device with ID "${deviceId}" not found`,
        },
        { status: 404 }
      );
    }

    const targetUrl = config.targetUrl || config.kioskUrl || config.url;

    return jsonWithCors({
      success: true,
      data: {
        deviceId: config.deviceId || deviceId,
        name: config.name,
        deviceName: config.name,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
        appVersion: config.appVersion,
        targetUrl,
        url: targetUrl,
        kioskUrl: targetUrl,
        batteryLevel: config.batteryLevel,
        isCharging: config.isCharging,
        isDeviceOwner: config.isDeviceOwner,
        lockTaskState: config.lockTaskState,
        model: config.model,
        manufacturer: config.manufacturer,
      },
    });
  } catch (error) {
    console.error('Error fetching device config:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to retrieve device config',
      },
      { status: 500 }
    );
  }
}
