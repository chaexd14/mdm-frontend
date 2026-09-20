import { NextRequest } from 'next/server';
import { kioskService } from '@/lib/kioskService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

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
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId and commandId are required',
        },
        { status: 400 }
      );
    }

    await kioskService.acknowledgeCommand(deviceId, commandId, status);

    return jsonWithCors({
      success: true,
    });
  } catch (error) {
    console.error('Error acknowledging command:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to acknowledge command',
      },
      { status: 500 }
    );
  }
}
