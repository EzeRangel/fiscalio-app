"use client";

import { UserCircle, Shield, ShieldOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePrivacyMode } from "@/components/providers/privacy-mode-provider";
import { Label } from "@/components/ui/label";

export function UserNav() {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
          aria-label="Menú de usuario"
        >
          <UserCircle className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Usuario</p>
            <p className="text-muted-foreground text-xs leading-none">
              demo@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2">
              {isPrivacyMode ? (
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Shield className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="privacy-mode" className="text-sm font-medium">
                Modo Privacidad
              </Label>
            </div>
            <Switch
              id="privacy-mode"
              checked={isPrivacyMode}
              onCheckedChange={togglePrivacyMode}
            />
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
