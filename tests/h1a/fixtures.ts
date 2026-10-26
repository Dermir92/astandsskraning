import { X509Certificate } from "node:crypto";
import { rootCertificates } from "node:tls";
import { resolve } from "node:path";

// Public trust material and deliberately unusable strings, never real credentials.
export const testCA = rootCertificates.find(pem => {
  const cert = new X509Certificate(pem);
  return cert.ca && Date.parse(cert.validFrom) < Date.now() && Date.parse(cert.validTo) > Date.now() + 86400000;
})!;
export function fixture() {
  const ref = "abcdefghijklmnopqrst";
  const host = "aws-7-eu-west-3.pooler.supabase.com"; // Arbitrary index, not inferred.
  return { NODE_ENV: "development" as const, H1A_HOSTED_PREPARATION: "1", H1A_PROJECT_REF: ref,
    H1A_SUPABASE_URL: `https://${ref}.supabase.co`, H1A_PUBLISHABLE_KEY: "sb_publishable_H1aSyntheticFixtureOnly",
    H1A_DB_MODE: "session", H1A_POOLER_HOST: host,
    H1A_DATABASE_URL: `postgresql://c1_executor.${ref}:synthetic-unusable-fixture@${host}:5432/postgres`,
    H1A_DB_TLS: "verify-full", H1A_DB_CA_FILE: resolve("artifacts/h1a/public-test-ca.crt"),
    H1A_DB_CA_SHA256: new X509Certificate(testCA).fingerprint256.replaceAll(":", "") };
}
