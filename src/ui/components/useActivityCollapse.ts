import { useEffect, useRef, useState, type AnimationEvent } from "react";

export function useActivityCollapse() {
  const [collapsing, setCollapsing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingFinish = useRef<(() => void) | undefined>(undefined);
  const cancelCollapse = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    pendingFinish.current = undefined;
    setCollapsing(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const finishCollapse = () => {
    if (!pendingFinish.current) return;
    const finish = pendingFinish.current;
    cancelCollapse();
    finish();
  };
  const collapse = (finish: () => void) => {
    if (pendingFinish.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion")) {
      finish();
      return;
    }
    pendingFinish.current = finish;
    setCollapsing(true);
    timer.current = setTimeout(finishCollapse, 1000);
  };
  const onCollapseAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName === "activityEntryCollapse") finishCollapse();
  };
  return { collapsing, collapse, cancelCollapse, onCollapseAnimationEnd };
}
