import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { AppShell } from "@/components/app-shell";

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
  return (
    <html lang="is">
      <body>
        <DemoProvider>
          <AppShell>{children}</AppShell>
        </DemoProvider>
      </body>
    </html>
  );
}
