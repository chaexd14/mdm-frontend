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
    const { enabled, message } = body;

    if (!deviceId) {
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    if (typeof enabled !== 'boolean') {
      return jsonWithCors(
        {
          success: false,
          error: 'enabled boolean field is required',
        },
        { status: 400 }
      );
    }

    const result = await deviceService.setDeviceMaintenance(deviceId, enabled, message);

    return jsonWithCors({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to update maintenance mode',
      },
      { status: 500 }
    );
  }
}
