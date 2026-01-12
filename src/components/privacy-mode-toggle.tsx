"use client";

import { Shield, ShieldOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePrivacyMode } from "@/components/providers/privacy-mode-provider";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PrivacyModeToggle() {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={() => togglePrivacyMode(!isPrivacyMode)}
                  className="justify-center"
                >
                  {isPrivacyMode ? <ShieldOff /> : <Shield />}
                  <span className="sr-only">Toggle Privacy Mode</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">
                Modo Privacidad: {isPrivacyMode ? "Activado" : "Desactivado"}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="border-t p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isPrivacyMode ? (
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Shield className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="privacy-mode-sidebar" className="text-sm font-medium">
            Modo Privacidad
          </Label>
        </div>
        <Switch
          id="privacy-mode-sidebar"
          checked={isPrivacyMode}
          onCheckedChange={togglePrivacyMode}
        />
      </div>
    </SidebarFooter>
  );
}
