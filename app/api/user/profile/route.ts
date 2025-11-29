import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = await cookies();
    const act = cookieStore.get("act");
    const rft = cookieStore.get("rft");

    if (!act && !rft) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieHeader = [];
    if (act) cookieHeader.push(`act=${act.value}`);
    if (rft) cookieHeader.push(`rft=${rft.value}`);

    try {
        const res = await fetch("http://localhost:8000/api/user/profile", {
            headers: {
                Cookie: cookieHeader.join("; "),
            },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch profile" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
