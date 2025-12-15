export type SlideLayout = "16x9" | "4x3" | "custom";

export interface SlideBackground {
  color?: string;
  image?: string;
}

export interface Position {
  x: number;
  y: number;
  width: number | string;
  height?: number | string;
}

export interface TextStyle {
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "lighter" | number;
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
}

export interface LineStyle {
  strokeColor?: string;
  strokeWidth?: number;
}

export interface ShapeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export type ElementStyle = TextStyle | LineStyle | ShapeStyle;

export interface TextElement {
  id: string;
  type: "text";
  content: string | string[];
  position: Position;
  style: TextStyle;
}

export interface LineElement {
  id: string;
  type: "line";
  position: Position;
  style: LineStyle;
}

export interface ShapeElement {
  id: string;
  type: "shape";
  shape: "rectangle" | "circle" | "ellipse" | string;
  position: Position;
  style: ShapeStyle;
}

export type SlideElement = TextElement | LineElement | ShapeElement;

export interface Slide {
  id: string;
  layout: SlideLayout;
  background: SlideBackground;
  elements: SlideElement[];
}

export interface SlideData {
  slide: Slide;
}
