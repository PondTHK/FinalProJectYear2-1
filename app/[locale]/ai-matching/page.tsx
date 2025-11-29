import { cookies } from "next/headers";
import AiMatchingClient from "./AiMatchingClient";

export default async function AiMatchingPage() {
    const cookieStore = await cookies();
    // Check for 'act' (access token) or 'rft' (refresh token)
    const isLoggedIn = !!cookieStore.get("act") || !!cookieStore.get("rft");

    return <AiMatchingClient isLoggedIn={isLoggedIn} />;
}
