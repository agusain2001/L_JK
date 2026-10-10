"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Keep real text, emphasis and natural wrapping while revealing individual words. */
export default function AnimatedHeading({ as: Tag = "h2", children, className = "", id }: {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = heading.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      element.classList.add("ink-visible");
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  let word = 0;
  function split(content: ReactNode): ReactNode {
    return Children.map(content, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child).split(/(\s+)/).map((part, index) => /^\s+$/.test(part) || !part ? part : (
          <span key={index} className="ink-word" style={{ "--ink-order": word++ } as CSSProperties}>{part}</span>
        ));
      }
      if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
        return cloneElement(child, undefined, split(child.props.children));
      }
      return child;
    });
  }
  return <Tag ref={heading} id={id} tabIndex={Tag === "h1" ? -1 : undefined} className={`kinetic-heading ${className}`}>{split(children)}</Tag>;
}
