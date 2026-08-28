import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

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

    const kiosk = await kioskService.getKioskByDeviceId(deviceId);

    if (!kiosk) {
      return NextResponse.json(
        {
          success: false,
          error: `Kiosk with deviceId "${deviceId}" not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: kiosk,
    });
  } catch (error) {
    console.error('Error fetching kiosk:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve kiosk details',
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

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, newDeviceId, location, os } = body;

    const updated = await kioskService.updateKioskDetails(deviceId, {
      name,
      newDeviceId,
      location,
      os,
    });

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: `Kiosk with deviceId "${deviceId}" not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating kiosk details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update kiosk details',
      },
      { status: 500 }
    );
  }
}

