"use client";

import React, { useState } from "react";
import Image from "next/image";
import Logo from "../../../../public/logo.png";
import { OrgSelector } from "./org-selector";
import { OnboardingForm } from "./form";
import { Organization } from "@/types/organizations";
import { Regime } from "@/types/taxRegimes";

interface Props {
  organizations: Organization[];
  regimes: Regime[];
}

export function OnboardingClientWrapper({ organizations, regimes }: Props) {
  const [showForm, setShowForm] = useState(organizations.length === 0);

  const subtitle = showForm
    ? "Comencemos configurando tu organización. Solo tomará 30 segundos."
    : "Selecciona una organización para comenzar o crea una nueva.";

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16">
          <Image src={Logo} width={64} height={64} alt="Logotipo Fiscalio" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight">
            Bienvenido a <span className="font-medium">Fiscalio</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed transition-all duration-300">
            {subtitle}
          </p>
        </div>
      </header>

      {showForm ? (
        <OnboardingForm regimes={regimes} />
      ) : (
        <OrgSelector
          organizations={organizations}
          onSwitchToForm={() => setShowForm(true)}
        />
      )}
    </div>
  );
}
