import { active } from "..";
import type { Reconciler } from "../reconciler/index";
import { arrayReconcileWithoutSorting } from "../reconciler/util";
import type {  ShadowElement } from "../types";

export default function Portal(props: {
  target: string;
  children: ShadowElement;
}): ShadowElement {
  if (active.parentElement === null) {
    throw new Error("Cant find currently rendering parent")
  }

  const portalExit = active.parentElement.ownerDocument.getElementById(
    props.target,
  );

  if (portalExit === null) {
    throw new Error("Could not find portal exit " + props.target);
  }
  active.parentElement = portalExit;

  return props.children;
}
