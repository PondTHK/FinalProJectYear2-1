import { nanoid } from 'nanoid';

export type FreeBlockType = 'heading' | 'text' | 'image' | 'button';

export interface FreeBlock {
  id: string;
  type: FreeBlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
}

export interface FreeDoc {
  id: string;
  blocks: FreeBlock[];
}

export const makeBlock = (type: FreeBlockType): FreeBlock => {
  const base = {
    id: nanoid(),
    type,
    x: 100, y: 100,
    width: 200, height: 60,
    props: {},
  };
  switch (type) {
    case 'heading': base.props = { text: 'Your Title' }; break;
    case 'text': base.props = { text: 'Editable paragraph...' }; break;
    case 'image': base.props = { src: '/images/placeholder.jpg' }; base.height = 120; break;
    case 'button': base.props = { label: 'Click', href: '#' }; break;
  }
  return base;
};

const KEY = 'FREE_BUILDER_V1';
export const loadDoc = (): FreeDoc => {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch {}
  return { id: nanoid(), blocks: [makeBlock('heading')] };
};
export const saveDoc = (doc: FreeDoc) => localStorage.setItem(KEY, JSON.stringify(doc));
