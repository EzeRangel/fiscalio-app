"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";
import { togglePrivacyMode as togglePrivacyModeAction } from "@/actions/privacy-mode";

interface PrivacyModeContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: (enabled: boolean) => void;
}

const PrivacyModeContext = createContext<PrivacyModeContextType | undefined>(
  undefined
);

export function PrivacyModeProvider({
  children,
  initialEnabled,
}: {
  children: React.ReactNode;
  initialEnabled: boolean;
}) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(initialEnabled);

  const { execute } = useAction(togglePrivacyModeAction, {
    onSuccess: ({ data }) => {
      // If we had a return value we could use it here
    },
    onError: ({ error }) => {
      // Revert state on error if needed
      console.error("Failed to toggle privacy mode", error);
    },
  });

  const toggle = (enabled: boolean) => {
    setIsPrivacyMode(enabled);
    execute({ enabled });
  };

  return (
    <PrivacyModeContext.Provider
      value={{ isPrivacyMode, togglePrivacyMode: toggle }}
    >
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode() {
  const context = useContext(PrivacyModeContext);
  if (context === undefined) {
    throw new Error("usePrivacyMode must be used within a PrivacyModeProvider");
  }
  return context;
}
