"use client";

type ContactSectionProps = {
  phone: string;
  email: string;
  nationality: string;
  location: string;
};

const entriesConfig = [
  { label: "เบอร์โทรศัพท์", accent: "#10b981", key: "phone" as const },
  { label: "Email", accent: "#6366f1", key: "email" as const },
  { label: "สัญชาติ", accent: "#f59e0b", key: "nation" as const },
  { label: "พื้นที่", accent: "#ec4899", key: "area" as const },
];

export default function ContactSection({
  phone,
  email,
  nationality,
  location,
}: ContactSectionProps) {
  const values = {
    phone: phone || "ยังไม่ระบุ",
    email: email || "ยังไม่ระบุ",
    nation: nationality || "ยังไม่ระบุ",
    area: location,
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#2d2b45]">Contact</h2>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {entriesConfig.map((entry) => (
          <div
            key={entry.label}
            className="rounded-3xl bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.05)]"
            style={{ borderTop: `4px solid ${entry.accent}` }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {entry.label}
            </p>
            <p className="mt-3 text-lg font-semibold text-[#2d2b45]">
              {values[entry.key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

