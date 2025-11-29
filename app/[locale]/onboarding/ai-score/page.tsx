import { Suspense } from "react";
import AiScoreClient from "./AiScoreClient";

// (ไม่บังคับ) ถ้าเพจนี้ไม่ต้อง prerender ตาม query เลย ใช้ static ได้
export const dynamic = "force-static";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24 }}>
          <p>Loading AI Score…</p>
        </div>
      }
    >
      <AiScoreClient />
    </Suspense>
  );
}
