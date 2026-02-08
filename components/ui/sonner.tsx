import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group pointer-events-none"
      duration={2500}
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md group-[.toaster]:text-sm group-[.toaster]:py-2 group-[.toaster]:px-3 group-[.toaster]:pr-8 group-[.toaster]:relative data-[removed]:animate-slide-out-right",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          closeButton: "group-[.toast]:absolute group-[.toast]:right-1 group-[.toast]:top-1 group-[.toast]:p-1 group-[.toast]:rounded-sm group-[.toast]:opacity-70 group-[.toast]:hover:opacity-100 group-[.toast]:transition-opacity group-[.toast]:bg-transparent group-[.toast]:border-0",
          error: "group-[.toaster]:border-destructive/50 group-[.toaster]:bg-destructive/10",
        },
      }}
      {...props}
    />
  );
};

// Custom toast wrapper that handles duration based on type
const toast = Object.assign(
  (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(message, { duration: 2500, ...options });
  },
  {
    success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
      return sonnerToast.success(message, { duration: 2500, ...options });
    },
    info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
      return sonnerToast.info(message, { duration: 2500, ...options });
    },
    warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
      return sonnerToast.warning(message, { duration: 2500, ...options });
    },
    error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
      // Error messages persist until manually dismissed
      return sonnerToast.error(message, { duration: Infinity, ...options });
    },
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
    dismiss: sonnerToast.dismiss,
  }
);

export { Toaster, toast };
