import Konva from "konva";
import type * as Y from "yjs";

import {
  colorToCss,
  getContrastingTextColor,
  getLayers,
  layerFromY,
  type Camera,
} from "@lattice/shared";

import { deleteLayers, updateLayers } from "@/lib/board-doc";
import { canvasToScreen } from "@/lib/canvas-math";
import type { BoardRenderer } from "@/lib/canvas-renderer";
import {
  isTextualLayer,
  textFont,
  textMetrics,
  type TextualLayer,
} from "@/lib/canvas-text";

const PLACEHOLDER = "Type something";

const OUTLINE = "#7c3aed";

type Session = {
  readonly id: string;
  readonly field: HTMLTextAreaElement;
  readonly ghosted: Konva.Text | null;
  readonly initial: string;
  readonly removable: boolean;
  insetY: number;
  innerHeight: number;
};

export class TextEditor {
  private session: Session | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly doc: Y.Doc,
    private readonly renderer: BoardRenderer,
  ) {}

  get editing(): string | null {
    return this.session?.id ?? null;
  }

  open(id: string, camera: Camera): void {
    if (this.session?.id === id) return;
    this.commit();

    const layer = this.read(id);
    if (!layer) return;

    const field = document.createElement("textarea");
    field.value = layer.value;
    field.placeholder = PLACEHOLDER;
    field.spellcheck = false;

    Object.assign(field.style, {
      position: "absolute",
      margin: "0",
      border: "0",
      outline: `1px solid ${OUTLINE}`,
      background: "transparent",
      caretColor: OUTLINE,
      resize: "none",
      overflow: "hidden",
      boxSizing: "border-box",
      cursor: "text",
      touchAction: "auto",
      whiteSpace: "pre-wrap",
      overflowWrap: "break-word",
    });

    const ghosted = this.renderer.textNode(id) ?? null;
    ghosted?.opacity(0);
    ghosted?.getLayer()?.batchDraw();

    const session: Session = {
      id,
      field,
      ghosted,
      initial: layer.value,
      removable: layer.type === "text",
      insetY: 0,
      innerHeight: 0,
    };

    this.host.appendChild(field);
    this.session = session;

    this.place(session, layer, camera);

    field.addEventListener("blur", this.onBlur);
    field.addEventListener("keydown", this.onKeyDown);
    field.addEventListener("input", this.onInput);

    field.focus({ preventScroll: true });
    field.select();
  }

  commit(): void {
    const session = this.session;
    if (!session) return;

    this.session = null;

    const value = session.field.value;
    this.teardown(session);

    if (session.removable && value.trim() === "") {
      deleteLayers(this.doc, [session.id]);
      return;
    }

    if (value === session.initial) return;

    updateLayers(this.doc, [session.id], () => ({ value }));
  }

  abandon(): void {
    const session = this.session;
    if (!session) return;

    this.session = null;
    this.teardown(session);
  }

  reflow(camera: Camera): void {
    const session = this.session;
    if (!session) return;

    const layer = this.read(session.id);
    if (!layer) {
      this.abandon();
      return;
    }

    this.place(session, layer, camera);
  }

  destroy(): void {
    this.commit();
  }

  private read(id: string): TextualLayer | null {
    const body = getLayers(this.doc).get(id);
    if (!body) return null;

    const layer = layerFromY(body);
    return isTextualLayer(layer) ? layer : null;
  }

  private place(session: Session, layer: TextualLayer, camera: Camera): void {
    const { fontSize, box, align } = textMetrics(layer);
    const origin = canvasToScreen({ x: layer.x, y: layer.y }, camera);
    const scale = camera.scale;

    const style = session.field.style;

    style.left = `${origin.x}px`;
    style.top = `${origin.y}px`;
    style.width = `${layer.width * scale}px`;
    style.height = `${layer.height * scale}px`;
    style.transformOrigin = "0 0";
    style.transform = `rotate(${layer.rotation}deg)`;

    style.fontFamily = textFont();
    style.fontSize = `${fontSize * scale}px`;
    style.lineHeight = `${fontSize * scale}px`;
    style.textAlign = align;
    style.color =
      layer.type === "note"
        ? getContrastingTextColor(layer.fill)
        : colorToCss(layer.fill);

    style.paddingLeft = `${box.x * scale}px`;
    style.paddingRight = `${box.x * scale}px`;
    style.paddingBottom = `${box.y * scale}px`;

    session.insetY = box.y * scale;
    session.innerHeight = box.height * scale;

    this.centre(session);
  }

  private centre(session: Session): void {
    const { field, insetY, innerHeight } = session;
    const height = field.style.height;

    field.style.paddingTop = `${insetY}px`;
    field.style.height = "0px";
    const content = field.scrollHeight - insetY * 2;
    field.style.height = height;

    const slack = Math.max(0, (innerHeight - content) / 2);
    field.style.paddingTop = `${insetY + slack}px`;
  }

  private teardown(session: Session): void {
    session.field.removeEventListener("blur", this.onBlur);
    session.field.removeEventListener("keydown", this.onKeyDown);
    session.field.removeEventListener("input", this.onInput);
    session.field.remove();

    session.ghosted?.opacity(1);
    session.ghosted?.getLayer()?.batchDraw();
  }

  private readonly onBlur = (): void => {
    this.commit();
  };

  private readonly onInput = (): void => {
    if (this.session) this.centre(this.session);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const commits =
      event.key === "Escape" ||
      (event.key === "Enter" && (event.metaKey || event.ctrlKey));

    if (!commits) return;

    event.preventDefault();
    event.stopPropagation();

    this.commit();
  };
}
