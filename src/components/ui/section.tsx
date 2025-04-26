import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  animate?: boolean;
}

export function Section({
  className,
  as: Component = "section",
  animate = true,
  ...props
}: SectionProps) {
  const content = (
    <Component
      className={cn("py-12 md:py-16 lg:py-20", className)}
      {...props}
    />
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}