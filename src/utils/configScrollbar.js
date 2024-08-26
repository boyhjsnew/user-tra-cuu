// scrollUtils.js
import { useEffect } from "react";

export function useImperativeDisableScroll({ element, disabled }) {
  useEffect(() => {
    if (!element) {
      return;
    }

    element.style.overflowY = disabled ? "hidden" : "scroll";

    return () => {
      element.style.overflowY = "scroll";
    };
  }, [disabled]);
}
