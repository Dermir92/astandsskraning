import { checkHostedTLSConfiguration, probeHostedTLS } from "../src/lib/cloud/hosted-tls-preflight.mjs";

// No .env discovery, credential input, host/port overrides, automatic retries or
// database client. A probe requires the literal --allow-network CLI argument.
try {
  const [command, ...args] = process.argv.slice(2);
  const live = command === "probe";
  const expected = live ? ["--allow-network", "--ca-file"] : ["--ca-file"];
  if (!["check", "probe"].includes(command) || args.length !== expected.length + 1 ||
      expected.some((value, index) => args[index] !== value) || !args.at(-1)) throw new Error();
  const caFile = args.at(-1);
  if (live) {
    const result = await probeHostedTLS(caFile, true);
    console.log(`H1b TLS verified (${result.protocol}). No database authentication attempted. Application access disabled.`);
  } else {
    checkHostedTLSConfiguration(caFile);
    console.log("H1b TLS configuration valid. No connection attempted. Application access disabled.");
  }
} catch {
  console.error("H1b TLS preflight unavailable. No application access enabled.");
  process.exitCode = 1;
}
