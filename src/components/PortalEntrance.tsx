import type { Reconciler } from "../reconciler/index";
import { arrayReconcileWithoutSorting } from "../reconciler/util";
import type { ShadowComponentElement, ShadowElement } from "../types";

const portalReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  const portalExitId = (shadowElement as ShadowComponentElement).props.target;
  const portalExit = (parentElement.ownerDocument as Document).getElementById(
    portalExitId,
  );
  if (portalExit === null) {
    throw new Error("Could not find portal exit " + portalExitId);
  }

  shadowCache.unmount = () => {
    for (const childNode of portalExit.childNodes) {
      childNode.remove();
    }
  };

  arrayReconcileWithoutSorting(
    portalExit,
    null,
    shadowCache,
    (shadowElement as ShadowComponentElement).children.map((child) => child()),
  );
  return previousSibling;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Portal(_props: {
  target: string;
  children: ShadowElement;
}): ShadowElement {
  // eslint-disable-next-line prefer-spread, prefer-rest-params
  return portalReconcile.apply(null, arguments as any) as any;
}
