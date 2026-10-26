/** @typedef {Record<string, string | undefined>} Environment */

/** @param {Environment} [env] */
export function developmentMode(env = process.env) {
  if (env.NODE_ENV !== "development") return "demo";
  const flags = [env.C1_LOCAL_PROOF, env.H1A_HOSTED_PREPARATION];
  if (flags.some(flag => flag !== undefined && flag !== "0" && flag !== "1")) return "disabled";
  if (flags.every(flag => flag === "1")) return "disabled";
  if (env.H1A_HOSTED_PREPARATION === "1") return "h1a-hosted";
  return env.C1_LOCAL_PROOF === "1" ? "c1-local" : "demo";
}

export const H1A_ORIGIN = "http://127.0.0.1:3101";

/** @param {Headers} headers */
export function h1aLocalRequest(headers) {
  return headers.get("host") === "127.0.0.1:3101" &&
    (!headers.has("origin") || headers.get("origin") === H1A_ORIGIN);
}
