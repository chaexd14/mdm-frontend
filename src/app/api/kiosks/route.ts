import { kioskService } from '@/lib/kioskService';
import { handleOptions, jsonWithCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const kiosks = await kioskService.getAllKiosks();
    return jsonWithCors({
      success: true,
      data: {
        kiosks,
      },
    });
  } catch (error) {
    console.error('Error fetching kiosks:', error);
    return jsonWithCors(
      {
        success: false,
        error: 'Failed to retrieve kiosks list',
      },
      { status: 500 }
    );
  }
}
