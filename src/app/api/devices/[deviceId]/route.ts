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

    const device = await deviceService.getDeviceByDeviceId(deviceId);

    if (!device) {
      return jsonWithCors(
        {
          success: false,
          error: `Device with ID "${deviceId}" not found`,
        },
        { status: 404 }
      );
    }

    return jsonWithCors({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to retrieve device details',
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
      return jsonWithCors(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, newDeviceId, location, os, model, manufacturer } = body;

    const updated = await deviceService.updateDeviceDetails(deviceId, {
      name,
      newDeviceId,
      location,
      os,
      model,
      manufacturer,
    });

    if (!updated) {
      return jsonWithCors(
        {
          success: false,
          error: `Device with ID "${deviceId}" not found`,
        },
        { status: 404 }
      );
    }

    return jsonWithCors({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating device details:', error);
    return jsonWithCors(
      {
        success: false,
        error: error.message || 'Failed to update device details',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await deviceService.deleteDevice(deviceId);

    return jsonWithCors({
      success: true,
      message: `Device "${deviceId}" deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting device:', error);
    return jsonWithCors(
      {
        success: false,
        error: error.message || 'Failed to delete device',
      },
      { status: 500 }
    );
  }
}
