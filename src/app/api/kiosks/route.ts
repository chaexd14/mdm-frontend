import { NextResponse } from 'next/server';
import { kioskService } from '@/lib/kioskService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kiosks = await kioskService.getAllKiosks();
    return NextResponse.json({
      success: true,
      data: {
        kiosks,
      },
    });
  } catch (error) {
    console.error('Error fetching kiosks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve kiosks list',
      },
      { status: 500 }
    );
  }
}
