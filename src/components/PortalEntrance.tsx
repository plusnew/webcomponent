import { active } from "..";
import { ShadowCache } from "../reconciler/utils";
import type {  ShadowElement } from "../types";

export default function Portal(props: {
  target: string;
  children: ShadowElement;
}, { shadowCache, parentElement}: { shadowCache: ShadowCache, parentElement: Element }): ShadowElement {
  if (shadowCache.node === null) {
    const portalExit = parentElement.ownerDocument.getElementById(
      props.target,
    );

    shadowCache.node = portalExit;
    shadowCache.getParentOverwrite = function() {
      return parentElement;
    }
    shadowCache.unmount = function() {
      delete (shadowCache as any).unmount;

      for (const nestedShadow of this.nestedShadows) {
        nestedShadow.remove();
      }
    }
    shadowCache.remove = function() {
      delete (shadowCache as any).remove;

      this.unmount();
    }
  }

  return props.children;
}
