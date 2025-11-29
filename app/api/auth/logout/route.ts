import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    const cookieStore = await cookies();

    // Delete cookies
    cookieStore.delete("act");
    cookieStore.delete("rft");

    return NextResponse.json({ success: true });
}
