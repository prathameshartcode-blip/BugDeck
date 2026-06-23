import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, fallback, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted border border-border select-none items-center justify-center text-sm font-medium text-muted-foreground",
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt="Avatar"
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span>{fallback || "U"}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
