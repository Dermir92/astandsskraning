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
  return (
    <>
      <BackLink />
      {loading ? (
        <p className="loading-text" role="status">
          Hleð staðbundnum drögum…
        </p>
      ) : (
        <EmptyState title="Skýrslan fannst ekki">
          <p>Drög eru bundin við vafrann þar sem þau voru stofnuð.</p>
          <Link className="button button-primary" href="/">
            Fara í mínar skýrslur
          </Link>
        </EmptyState>
      )}
    </>
  );
}
