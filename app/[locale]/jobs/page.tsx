import { cookies } from "next/headers";
import JobsClient from "./JobsClient";

export default async function JobsPage() {
  const cookieStore = await cookies();
  // Check for 'act' (access token) or 'rft' (refresh token)
  const isLoggedIn = !!cookieStore.get("act") || !!cookieStore.get("rft");

  return <JobsClient isLoggedIn={isLoggedIn} />;
}
