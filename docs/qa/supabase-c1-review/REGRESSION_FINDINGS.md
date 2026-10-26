# Unresolved regression verification findings

**C1 approval remains blocked.** The complete regression includes failures; passing isolated rechecks do not replace them. Default demonstration-mode compatibility is not established by this candidate.

The requested C1 recovery/replay corrections and security upgrade have passing focused/C1/static/security evidence. The following ordinary demo navigation/focus executions remain unresolved. No default application navigation or focus implementation was changed to force a passing result.

| Project / scenario | Full-run result | Unchanged-source, one-worker recheck |
| --- | --- | --- |
| desktop · read-protected reports neither write navigation metadata nor mutate unreadable source data | failed | passed |
| mobile-360 · read-protected reports neither write navigation metadata nor mutate unreadable source data | failed | passed |
| mobile-390 · read-protected reports neither write navigation metadata nor mutate unreadable source data | failed | passed |
| desktop · meter corrections preserve history and room position, re-enter after ordinary navigation and work with zero rooms | failed | passed |
| mobile-360 · meter corrections preserve history and room position, re-enter after ordinary navigation and work with zero rooms | failed | passed |

The first recorded failure leaves the requested read-protected checklist item collapsed. Another fails to focus the requested meter correction field. These observations are browser-test behavior failures; their cause has not been established as only a test-driver issue. Assertions after the failure point were not executed in those scenarios. No SQL overwrite or cross-owner data disclosure is demonstrated by these failures.

The isolated recheck uses the same source and assertions with one worker and no automatic retries. Different outcomes across runs indicate intermittency/workload sensitivity, not proof that the original failure is resolved. Both primary reports and every failure are retained. The aggregate never substitutes a recheck for a failed full-run execution.

Before approval: reproduce and diagnose the remaining navigation/focus failures, distinguish framework compatibility from test assumptions, make a separately reviewed targeted correction if needed, and obtain a clean complete regression result. Until then, do not claim default demonstration mode is verified unchanged or C1 is approved.

The localStorage cross-tab limitation also remains under the previously accepted single-tab/fictional-data restriction. No C2 or Phase 7b work was started.
