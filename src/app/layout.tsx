import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
import { AppShell } from "@/components/app-shell";
import { C1Root } from "@/components/cloud/c1-root";
import { headers } from "next/headers";
import { developmentMode, h1aLocalRequest } from "@/lib/cloud/development-mode.mjs";
import { hostedPreparationStatus } from "@/lib/cloud/hosted-preparation";

export const metadata: Metadata = {
  title: {
    default: "Ástandsskráning · Mínar skýrslur",
    template: "%s · Ástandsskráning",
  },
  description:
    "Íslensk framendafrumgerð fyrir ástandsskráningu eigna. Áfangi 1A, eingöngu sýnihamur.",
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const mode = developmentMode();
  if (mode === "h1a-hosted" || mode === "disabled") {
    const local = mode === "h1a-hosted" && h1aLocalRequest(await headers());
    const status = local ? hostedPreparationStatus().configuration : "invalid";
    return <html lang="is"><body><main id="main">
      <h1>H1a · Undirbúningur hýsts þróunarumhverfis</h1>
      <p>{status === "valid" ? "Stillingar staðfestar staðbundið." : "Stillingar eru ekki tiltækar eða hamur er óvirkur."}</p>
      <p>Tenging við Supabase er óvirk. Engin innskráning, gagnasókn eða vistun er í boði.</p>
    </main></body></html>;
  }
  const Provider = mode === "c1-local" ? C1Root : DemoProvider;
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
