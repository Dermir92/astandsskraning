import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Síðan fannst ekki</h1>
      <p>Þessi slóð er ekki til í frumgerðinni.</p>
      <Link href="/" className="button button-primary">
        Mínar skýrslur
      </Link>
    </div>
  );
}
