import { NextRequest } from 'next/server';
import { kioskService } from '@/lib/kioskService';
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

    const config = await kioskService.getKioskConfig(deviceId);

    if (!config) {
      return jsonWithCors(
        {
          success: false,
          error: `Kiosk with deviceId "${deviceId}" not found`,
        },
        { status: 404 }
      );
    }

    return jsonWithCors({
      success: true,
      data: {
        deviceId: config.deviceId || deviceId,
        name: config.name,
        deviceName: config.name,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
        appVersion: config.appVersion,
        kioskUrl: config.kioskUrl,
        batteryLevel: config.batteryLevel,
        isCharging: config.isCharging,
        isDeviceOwner: config.isDeviceOwner,
        lockTaskState: config.lockTaskState,
        model: config.model,
        manufacturer: config.manufacturer,
      },
    });
  } catch (error) {
    console.error('Error fetching kiosk config:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to retrieve kiosk config',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> | { deviceId: string } }
) {
  try {
    const { deviceId } = await Promise.resolve(context.params);
    const body = await request.json();
    const { kioskUrl, url, maintenanceMode, maintenanceMessage } = body;

    if (!deviceId) {
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const targetUrl = kioskUrl || url;
    if (targetUrl && typeof targetUrl === 'string') {
      await kioskService.updateKioskUrl(deviceId, targetUrl);
    }

    if (typeof maintenanceMode === 'boolean') {
      await kioskService.setMaintenanceMode(deviceId, maintenanceMode, maintenanceMessage);
    }

    const updatedConfig = await kioskService.getKioskConfig(deviceId);

    return jsonWithCors({
      success: true,
      data: {
        maintenanceMode: updatedConfig?.maintenanceMode ?? false,
        maintenanceMessage: updatedConfig?.maintenanceMessage ?? null,
        appVersion: updatedConfig?.appVersion ?? '1.0.0',
        kioskUrl: updatedConfig?.kioskUrl,
      },
    });
  } catch (error) {
    console.error('Error updating kiosk config:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to update kiosk config',
      },
      { status: 500 }
    );
  }
}
