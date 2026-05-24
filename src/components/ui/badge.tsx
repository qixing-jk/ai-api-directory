import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "~/lib/cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-focus/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-danger aria-invalid:ring-danger/20 dark:aria-invalid:ring-danger/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-foreground [a]:hover:bg-brand/80",
        secondary:
          "bg-surface-muted text-foreground [a]:hover:bg-surface-muted/80",
        destructive:
          "bg-danger/10 text-danger focus-visible:ring-danger/20 dark:bg-danger/20 dark:focus-visible:ring-danger/40 [a]:hover:bg-danger/20",
        outline:
          "border-border text-foreground [a]:hover:bg-surface-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-surface-muted hover:text-muted-foreground dark:hover:bg-surface-muted/50",
        link: "text-brand underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
