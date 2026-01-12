"use client";

import { usePrivacyMode } from "./providers/privacy-mode-provider";
import { cn } from "@/lib/utils";

interface PrivacyBlurProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

/**
 * A wrapper component that blurs its content when Privacy Mode is active.
 * @param active - Optional override to force blur regardless of global state.
 */
export function PrivacyBlur({ children, className, active }: PrivacyBlurProps) {
  const { isPrivacyMode } = usePrivacyMode();
  const shouldBlur = active ?? isPrivacyMode;

  return (
    <span 
      className={cn(
        shouldBlur && "privacy-blur", 
        "inline-block", // Ensure blur applies correctly to the container
        className
      )}
    >
      {children}
    </span>
  );
}
