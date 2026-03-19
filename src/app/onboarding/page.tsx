import Image from "next/image";
import { getTaxRegimes } from "@/data/taxRegimes";
import { OnboardingForm } from "./_components/form";
import Logo from "../../../public/logo.png";

const getData = async () => {
  const [regimes] = await Promise.all([getTaxRegimes()]);

  return {
    regimes,
  };
};

export default async function OnboardingPage() {
  const { regimes } = await getData();

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16">
            <Image src={Logo} width={64} height={64} alt="Logotipo Fiscalio" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-light tracking-tight">
              Bienvenido a <span className="font-medium">Fiscalio</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Comencemos configurando tu organización. Solo tomará 30 segundos.
            </p>
          </div>
        </header>

        <OnboardingForm regimes={regimes} />
      </div>
    </div>
  );
}
