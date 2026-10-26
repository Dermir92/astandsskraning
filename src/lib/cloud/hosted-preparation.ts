import "server-only";
import { hostedConfiguration } from "./hosted-config.mjs";

// The HTTP/UI boundary receives status only, including with valid configuration.
// H1a deliberately contains no hosted Auth/REST/SQL transport.
export function hostedPreparationStatus() {
  try {
    hostedConfiguration();
    return { mode: "h1a-hosted", configuration: "valid", access: "disabled" } as const;
  } catch {
    return { mode: "h1a-hosted", configuration: "invalid", access: "disabled" } as const;
  }
}
