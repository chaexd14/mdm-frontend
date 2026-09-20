import { NextRequest } from 'next/server';
import { deviceService } from '@/lib/deviceService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId') || undefined;

    const commands = await deviceService.getRecentCommands(deviceId);

    return jsonWithCors({
      success: true,
      data: {
        commands,
      },
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to retrieve commands',
      },
      { status: 500 }
    );
  }
}
