import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { AppShell } from "@/components/app-shell";
import { C1Root } from "@/components/cloud/c1-root";

export const metadata: Metadata = {
  title: {
    default: "Ástandsskráning · Mínar skýrslur",
    template: "%s · Ástandsskráning",
  },
  description:
    "Íslensk framendafrumgerð fyrir ástandsskráningu eigna. Áfangi 1A, eingöngu sýnihamur.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const Provider = process.env.NODE_ENV === "development" && process.env.C1_LOCAL_PROOF === "1" ? C1Root : DemoProvider;
  return (
    <html lang="is">
      <body>
        <Provider>
          <AppShell>{children}</AppShell>
        </Provider>
      </body>
    </html>
  );
}
