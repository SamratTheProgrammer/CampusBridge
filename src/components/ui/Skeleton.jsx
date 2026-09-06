import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("rounded-md bg-muted/60", className)}
      {...props}
    />
  )
}

export { Skeleton }
