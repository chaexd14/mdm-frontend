import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

// GET /api/kiosks/[deviceId]/commands - agent retrieves pending commands
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ deviceId: string }> | { deviceId: string } }
) {
  try {
    const { deviceId } = await Promise.resolve(context.params);

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const commands = await kioskService.getPendingCommands(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        commands,
      },
    });
  } catch (error) {
    console.error('Error getting commands:', error);
    return NextResponse.json(
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
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'command type is required (e.g., restart, shutdown, refresh)',
        },
        { status: 400 }
      );
    }

    const result = await kioskService.createCommand(deviceId, type, payload);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating command:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create command',
      },
      { status: 500 }
    );
  }
}
