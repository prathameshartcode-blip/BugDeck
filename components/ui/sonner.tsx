"use client"

import { useTheme } from "@/components/providers/theme-provider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-lg rounded-xl border",
          description: "group-[.toast]:text-muted-foreground text-xs",
          title: "text-sm font-semibold",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-semibold rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-semibold rounded-md",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
