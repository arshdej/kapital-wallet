import { useEffect, useMemo, useState } from "react";

interface Size {
  width: number | undefined;
  height: number | undefined;
}

interface Mode {
  mode: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

export type WindowSize = Size;

const useWindowSize = (): Size & Mode => {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<Size>({
    width: undefined,
    height: undefined,
  });

  const mode = useMemo(() => {
    let mode: Mode["mode"] = "xs";
    const { width } = windowSize;

    if (width) {
      if (width > 320) {
        mode = "xs";
      }
      if (width > 640) {
        mode = "sm";
      }
      if (width > 768) {
        mode = "md";
      }
      if (width > 1024) {
        mode = "lg";
      }
      if (width > 1280) {
        mode = "xl";
      }
      if (width > 1536) {
        mode = "2xl";
      }
    }
    return mode;
  }, [windowSize.width]);

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth || window.screen.width,
        height: window.innerHeight || window.screen.height,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    height: Number(windowSize.height || 0),
    width: Number(windowSize.width || 0),
    mode,
  };
};

export default useWindowSize;
