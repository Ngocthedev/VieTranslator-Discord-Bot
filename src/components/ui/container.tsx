import React from "react";
import { cn } from "../../lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  size?: "default" | "sm" | "lg" | "xl" | "full";
}

export function Container({
  className,
  as: Component = "div",
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto px-4 md:px-6",
        {
          "max-w-screen-xl": size === "xl",
          "max-w-screen-lg": size === "lg",
          "max-w-screen-md": size === "default",
          "max-w-screen-sm": size === "sm",
          "max-w-none": size === "full",
        },
        className
      )}
      {...props}
    />
  );
}