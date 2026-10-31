import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export function RevealOnScroll(props: { children: ReactNode; delayMs?: number; className?: string }) {
  const { children, delayMs, className } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(function () {
    if (typeof window === "undefined") {
      return true;
    }
    if (typeof window.matchMedia === "function") {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(function () {
    if (visible) {
      return;
    }
    if (typeof window === "undefined") {
      setVisible(true);
      return;
    }
    if (typeof window.matchMedia === "function") {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setVisible(true);
          return;
        }
      } catch {
        // fall through to observer path
      }
    }
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const el: HTMLDivElement | null = ref.current;
    if (!el) {
      setVisible(true);
      return;
    }
    const observer: IntersectionObserver = new IntersectionObserver(
      function (entries: IntersectionObserverEntry[]) {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return function () {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [visible]);

  const cls: string = "pp-reveal" + (visible ? " is-visible" : "") + (className ? " " + className : "");
  const style: CSSProperties | undefined =
    typeof delayMs === "number" ? { transitionDelay: delayMs + "ms" } : undefined;

  return (
    <div ref={ref} className={cls} style={style}>
      {children}
    </div>
  );
}
