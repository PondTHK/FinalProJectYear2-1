import { NextResponse } from 'next/server';
import { MOCK_SOCIAL_DATA } from '@/app/lib/mockSocialData';

export async function GET() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
        success: true,
        data: MOCK_SOCIAL_DATA.facebook
    });
}
