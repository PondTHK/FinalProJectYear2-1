export type ElementType = "Text" | "Image";

export interface ElementPosition {
  x: number;
  y: number;
}

export interface BaseElement<T extends ElementType, P> {
  id: string;
  type: T;
  position: ElementPosition;
  properties: P;
}

export interface TextElementProperties {
  content: string;
  alignment: "left" | "center" | "right";
  fontSize: number;
  color: string;
  weight: "normal" | "medium" | "bold";
  lineHeight: number;
  letterSpacing: number;
}

export type TextElement = BaseElement<"Text", TextElementProperties>;

// Image Element
export interface ImageElementProperties {
  src: string;
  alt: string;
  objectFit: "cover" | "contain" | "fill" | "none";
  width: number;
  height: number;
  cornerRadius: number;
}

export type ImageElement = BaseElement<"Image", ImageElementProperties>;

// Union Type
export type BuilderElement = TextElement | ImageElement;

// Page Settings
export interface PageSettings {
  backgroundColor: string;
  backgroundImage: string;
}

export const createDefaultElement = (
  type: ElementType,
  id: string,
  position: ElementPosition = { x: 120, y: 120 },
): BuilderElement => {
  switch (type) {
    case "Text":
      return {
        id,
        type,
        position,
        properties: {
          content: "Start telling your story with a beautiful headline",
          alignment: "left",
          fontSize: 28,
          color: "#e2e8f0", // Default to a light color for dark backgrounds
          weight: "medium",
          lineHeight: 1.4,
          letterSpacing: 0,
        },
      };
    case "Image":
    default:
      return {
        id,
        type: "Image",
        position,
        properties: {
          src: "https://gdb.voanews.com/EEA0B145-95D4-4532-9C69-D0FCD1833D53_w408_r0_s.jpg", // Default placeholder
          alt: "Placeholder image",
          objectFit: "cover",
          width: 400,
          height: 300,
          cornerRadius: 12,
        },
      };
  }
};

export const isTextElement = (
  element: BuilderElement,
): element is TextElement => element.type === "Text";

export const isImageElement = (
  element: BuilderElement,
): element is ImageElement => element.type === "Image";
