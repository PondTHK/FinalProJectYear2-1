import { NextResponse } from 'next/server';

export async function POST() {
    // Simulate a delay for the "authentication" process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
        success: true,
        token: "mock_social_token_12345",
        provider: "facebook",
        user: {
            name: "Thanakron (Mock)",
            email: "mock@example.com"
        }
    });
}
