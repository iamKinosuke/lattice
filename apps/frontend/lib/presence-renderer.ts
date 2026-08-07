import Konva from "konva";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import {
  getLayers,
  layerFromY,
  type AwarenessState,
  type Presence,
  type PresenceUser,
} from "@lattice/shared";

import { strokeToPathData } from "@/lib/stroke";

const CURSOR_ARROW = "M0,0 L0,17 L4.3,13 L7.1,18.8 L10,17.4 L7.2,11.7 L12.6,11.7 Z";

const LABEL_OFFSET = { x: 12, y: 18 };

export class PresenceRenderer {
  private readonly layer = new Konva.Layer({ listening: false });
  private readonly peers = new Map<number, PeerNode>();
  private scale = 1;

  constructor(
    stage: Konva.Stage,
    private readonly doc: Y.Doc,
    private readonly awareness: Awareness,
  ) {
    stage.add(this.layer);
    this.awareness.on("change", this.sync);
    this.doc.on("update", this.onDocChanged);
    this.sync();
  }

  destroy(): void {
    this.awareness.off("change", this.sync);
    this.doc.off("update", this.onDocChanged);
    this.layer.destroy();
    this.peers.clear();
  }

  setScale(scale: number): void {
    if (scale === this.scale) return;
    this.scale = scale;

    for (const peer of this.peers.values()) peer.setScale(scale);

    this.layer.batchDraw();
  }

  private readonly onDocChanged = (): void => {
    if (this.peers.size === 0) return;

    for (const peer of this.peers.values()) peer.redrawSelection(this.doc);
    this.layer.batchDraw();
  };

  private readonly sync = (): void => {
    const live = new Set<number>();

    for (const [clientId, raw] of this.awareness.getStates()) {
      if (clientId === this.awareness.clientID) continue;

      const state = raw as Partial<AwarenessState>;
      if (!state.user?.id) continue;

      live.add(clientId);
      this.apply(clientId, state.user, state.presence);
    }

    for (const [clientId, peer] of this.peers) {
      if (live.has(clientId)) continue;
      peer.destroy();
      this.peers.delete(clientId);
    }

    this.layer.batchDraw();
  };

  private apply(
    clientId: number,
    user: PresenceUser,
    presence: Presence | undefined,
  ): void {
    let peer = this.peers.get(clientId);

    if (!peer) {
      peer = new PeerNode(user, this.scale);
      this.layer.add(peer.selection, peer.draft, peer.cursor);
      this.peers.set(clientId, peer);
    }

    peer.apply(presence, this.doc);
  }
}

class PeerNode {
  readonly cursor: Konva.Group;
  readonly draft = new Konva.Path();
  readonly selection = new Konva.Group({ listening: false });
  private readonly color: string;
  private scale: number;
  private ids: readonly string[] = [];

  constructor(user: PresenceUser, scale: number) {
    this.color = user.color;
    this.scale = scale;

    this.cursor = new Konva.Group({
      visible: false,
      scaleX: 1 / scale,
      scaleY: 1 / scale,
    });

    this.cursor.add(
      new Konva.Path({
        data: CURSOR_ARROW,
        fill: user.color,
        stroke: "#ffffff",
        strokeWidth: 1,
      }),
    );

    const label = new Konva.Label({ ...LABEL_OFFSET });
    label.add(new Konva.Tag({ fill: user.color, cornerRadius: 3 }));
    label.add(
      new Konva.Text({
        text: user.name,
        fontSize: 11,
        fontStyle: "600",
        padding: 4,
        fill: "#ffffff",
      }),
    );
    this.cursor.add(label);

    this.draft.fill(user.color);
  }

  setScale(scale: number): void {
    this.scale = scale;
    this.cursor.scale({ x: 1 / scale, y: 1 / scale });
    for (const box of this.selection.getChildren()) {
      (box as Konva.Rect).strokeWidth(1.5 / scale);
    }
  }

  apply(presence: Presence | undefined, doc: Y.Doc): void {
    const cursor = presence?.cursor ?? null;

    this.cursor.visible(cursor !== null);
    if (cursor) this.cursor.position(cursor);

    const points = presence?.pencilDraft ?? null;
    this.draft.data(
      points ? strokeToPathData(points, false, presence?.penSize ?? undefined) : "",
    );

    this.ids = presence?.selection ?? [];
    this.redrawSelection(doc);
  }

  redrawSelection(doc: Y.Doc): void {
    while (this.selection.getChildren().length < this.ids.length) {
      this.selection.add(
        new Konva.Rect({
          stroke: this.color,
          strokeWidth: 1.5 / this.scale,
          listening: false,
        }),
      );
    }

    const boxes = this.selection.getChildren() as Konva.Rect[];

    this.ids.forEach((id, index) => {
      const box = boxes[index]!;
      const body = getLayers(doc).get(id);

      if (!body) {
        box.visible(false);
        return;
      }

      const layer = layerFromY(body);
      box.setAttrs({
        visible: true,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation,
      });
    });

    for (let i = this.ids.length; i < boxes.length; i++) boxes[i]!.visible(false);
  }

  destroy(): void {
    this.cursor.destroy();
    this.draft.destroy();
    this.selection.destroy();
  }
}
