// src/lib/profile-types.ts
import { nanoid } from "nanoid";

export type BlockType = "heading" | "text" | "image" | "button" | "eye";

export type Block = {
  id: string;
  type: BlockType;
  colSpan: number; // 1..12
  props: Record<string, any>;
};

export type Section = {
  id: string;
  blocks: Block[];
};

export type ProfileDoc = {
  id: string;
  title: string;
  sections: Section[];
  updatedAt: number;
};

export const makeBlock = (type: BlockType, partial?: Partial<Block>): Block => {
  const base: Block = {
    id: nanoid(),
    type,
    colSpan: 12,
    props: {},
  };
  switch (type) {
    case "heading":
      base.props = { text: "Your big headline", align: "left" };
      break;
    case "text":
      base.props = { text: "Write something here...", align: "left" };
      break;
    case "image":
      base.props = {
        src: "/images/placeholder.jpg",
        alt: "image",
        radius: 12,
        fit: "cover",
      };
      break;
    case "button":
      base.props = { label: "Click me", href: "#", variant: "contained" };
      break;
    case "eye":
      base.props = { src: "/videos/preview.mp4", size: "min(46vw, 520px)" };
      break;
  }
  return { ...base, ...partial };
};

export const makeDoc = (): ProfileDoc => ({
  id: nanoid(),
  title: "Untitled Profile",
  updatedAt: Date.now(),
  sections: [
    {
      id: nanoid(),
      blocks: [
        makeBlock("heading", { colSpan: 12 }),
        makeBlock("text", { colSpan: 7 }),
        makeBlock("eye", { colSpan: 5 }),
      ],
    },
  ],
});

// localStorage persistence (เบา/ง่าย)
const KEY = "PROFILE_DOC_V1";
export const loadDoc = (): ProfileDoc => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const doc = makeDoc();
  localStorage.setItem(KEY, JSON.stringify(doc));
  return doc;
};

export const saveDoc = (doc: ProfileDoc) => {
  localStorage.setItem(KEY, JSON.stringify({ ...doc, updatedAt: Date.now() }));
};
