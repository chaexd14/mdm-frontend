import { NextRequest } from 'next/server';
import { kioskService } from '@/lib/kioskService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

// GET /api/kiosks/[deviceId]/commands - agent retrieves pending commands with optional long-poll wait
export async function GET(
  request: NextRequest,
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

    const searchParams = request.nextUrl?.searchParams;
    const waitSeconds = Math.max(0, Math.min(30, parseInt(searchParams?.get('wait') || '0', 10)));
    const waitMs = waitSeconds * 1000;

    const commands = await kioskService.getPendingCommands(deviceId, waitMs);

    return jsonWithCors({
      success: true,
      data: {
        commands,
      },
    });
  } catch (error) {
    console.error('Error getting commands:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to retrieve commands',
      },
      { status: 500 }
    );
  }
}

// POST /api/kiosks/[deviceId]/commands - dashboard creates a command
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> | { deviceId: string } }
) {
  try {
    const { deviceId } = await Promise.resolve(context.params);
    const body = await request.json();
    const { type, payload } = body;

    if (!deviceId) {
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    if (!type) {
      return jsonWithCors(
        {
          success: false,
          error: 'command type is required (e.g., reload, lock_kiosk, unlock_kiosk, set_url, set_maintenance)',
        },
        { status: 400 }
      );
    }

    const result = await kioskService.createCommand(deviceId, type, payload);

    return jsonWithCors({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating command:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to create command',
      },
      { status: 500 }
    );
  }
}
