import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, deviceName, name, os, agentVersion, appVersion, location } = body;

    if (!deviceId) {
      return NextResponse.json(
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
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error registering kiosk:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register kiosk',
      },
      { status: 500 }
    );
  }
}
