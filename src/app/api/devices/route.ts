import { deviceService } from '@/lib/deviceService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const devices = await deviceService.getAllDevices();
    return jsonWithCors({
      success: true,
      data: {
        devices,
        kiosks: devices,
      },
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to retrieve devices list',
      },
      { status: 500 }
    );
  }
}
