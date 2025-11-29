"use client";

export default function BackgroundShapes() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(226,232,240,0.6),_transparent_60%)]" />
      <div className="pointer-events-none absolute -top-16 left-16 h-48 w-48 rounded-[40px] border border-slate-200/60 bg-white blur-xl" />
      <div className="pointer-events-none absolute right-20 top-1/3 h-32 w-32 rotate-12 rounded-[30%] border border-slate-200/60 bg-white/80 blur-lg" />
      <div className="pointer-events-none absolute bottom-16 left-1/3 h-20 w-72 rounded-[999px] border border-slate-100 bg-white blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-12 h-80 w-80 rounded-full bg-[#cfd7ff]/60 blur-[140px]" />
    </>
  );
}

