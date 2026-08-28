import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId') || undefined;

    const commands = await kioskService.getRecentCommands(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        commands,
      },
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve commands',
      },
      { status: 500 }
    );
  }
}
