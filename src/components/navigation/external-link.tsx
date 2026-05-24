import { ExternalLinkIcon } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/cn";

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  showIcon?: boolean;
};

export function ExternalLink({
  children,
  className,
  showIcon = true,
  target = "_blank",
  rel,
  ...props
}: ExternalLinkProps) {
  const safeRel =
    target === "_blank"
      ? Array.from(
          new Set([
            ...(rel?.split(/\s+/).filter(Boolean) ?? []),
            "noopener",
            "noreferrer",
          ]),
        ).join(" ")
      : rel;

  return (
    <a
      className={cn("inline-flex items-center gap-1", className)}
      target={target}
      rel={safeRel}
      {...props}
    >
      {children}
      {showIcon ? (
        <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
    </a>
  );
}
