import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getOrganizations } from "@/data/organizations";
import App from "@/components/App";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

import { cookies } from "next/headers";
import { PRIVACY_MODE_COOKIE } from "@/lib/privacy-mode";
import { PrivacyModeProvider } from "@/components/providers/privacy-mode-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CFDI Assistant",
  description: "Gestión inteligente de comprobantes fiscales digitales",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizations = await getOrganizations();

  // ! This makes the entire app dynamic
  // TODO: Look for a way to prevent this, maybe a server action that is consumed with react query
  const cookieStore = await cookies();
  const privacyModeEnabled =
    cookieStore.get(PRIVACY_MODE_COOKIE)?.value === "true";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <App>
          <PrivacyModeProvider initialEnabled={privacyModeEnabled}>
            <div className="[--header-height:calc(--spacing(14))]">
              <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                  <AppSidebar organizations={organizations} />
                  <SidebarInset>
                    {children}
                    <footer className="p-4">
                      <p className="leading-relaxed text-xs text-center text-muted-foreground">
                        Esta plataforma es una herramienta de asistencia e
                        información. Los cálculos presentados son estimaciones y
                        no sustituyen la asesoría fiscal profesional ni las
                        declaraciones oficiales ante el SAT.
                      </p>
                    </footer>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </div>
            <Toaster />
          </PrivacyModeProvider>
        </App>
      </body>
    </html>
  );
}
