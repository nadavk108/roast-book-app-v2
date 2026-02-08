import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const brutalCardVariants = cva(
  "border-3 border-foreground bg-card text-card-foreground transition-all duration-150",
  {
    variants: {
      variant: {
        default: "shadow-brutal",
        elevated: "shadow-brutal-lg",
        flat: "",
        interactive:
          "shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        primary: "bg-primary shadow-brutal",
        accent: "bg-accent shadow-brutal",
      },
      radius: {
        default: "rounded-xl",
        sm: "rounded-lg",
        lg: "rounded-2xl",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      radius: "default",
    },
  }
);

export interface BrutalCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof brutalCardVariants> {}

const BrutalCard = React.forwardRef<HTMLDivElement, BrutalCardProps>(
  ({ className, variant, radius, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(brutalCardVariants({ variant, radius, className }))}
      {...props}
    />
  )
);
BrutalCard.displayName = "BrutalCard";

const BrutalCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
BrutalCardHeader.displayName = "BrutalCardHeader";

const BrutalCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-heading text-2xl font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
BrutalCardTitle.displayName = "BrutalCardTitle";

const BrutalCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
BrutalCardDescription.displayName = "BrutalCardDescription";

const BrutalCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
BrutalCardContent.displayName = "BrutalCardContent";

const BrutalCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
BrutalCardFooter.displayName = "BrutalCardFooter";

export {
  BrutalCard,
  BrutalCardHeader,
  BrutalCardFooter,
  BrutalCardTitle,
  BrutalCardDescription,
  BrutalCardContent,
  brutalCardVariants,
};
