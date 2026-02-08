import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const brutalBadgeVariants = cva(
  "inline-flex items-center border-2 border-foreground px-3 py-1 text-sm font-heading font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-brutal-hover",
        accent: "bg-accent text-accent-foreground shadow-brutal-hover",
        secondary: "bg-secondary text-secondary-foreground shadow-brutal-hover",
        outline: "bg-background text-foreground",
        muted: "bg-muted text-muted-foreground border-muted-foreground",
      },
      size: {
        default: "text-sm rounded-md",
        sm: "text-xs px-2 py-0.5 rounded",
        lg: "text-base px-4 py-1.5 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BrutalBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof brutalBadgeVariants> {}

function BrutalBadge({ className, variant, size, ...props }: BrutalBadgeProps) {
  return (
    <div className={cn(brutalBadgeVariants({ variant, size }), className)} {...props} />
  );
}

export { BrutalBadge, brutalBadgeVariants };
