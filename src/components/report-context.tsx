"use client";

import { useParams } from "next/navigation";
import { useDemo } from "./demo-provider";
import { BackLink, EmptyState } from "./ui";
import Link from "next/link";

export function useReport() {
  const { id } = useParams<{ id: string }>();
  const demo = useDemo();
  return { ...demo, report: demo.state.reports.find((r) => r.id === id), id };
}
export function MissingReport({ loading = false }: { loading?: boolean }) {
  const { mode } = useDemo();
  return (
    <>
      <BackLink />
      {loading ? (
        <p className="loading-text" role="status">
          {mode === "cloud" ? "Sæki drög úr staðbundnum gagnagrunni…" : "Hleð staðbundnum drögum…"}
        </p>
      ) : (
        <EmptyState title="Skýrslan fannst ekki">
          <p>{mode === "cloud" ? "Skýrslan er ekki tiltæk fyrir innskráðan prófreikning. Athugaðu tengingu eða opnaðu skýrsluyfirlitið." : "Drög eru bundin við vafrann þar sem þau voru stofnuð."}</p>
          <Link className="button button-primary" href="/">
            Fara í mínar skýrslur
          </Link>
        </EmptyState>
      )}
    </>
  );
}
