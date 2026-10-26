"""Verify portable complete-suite coverage without replacing failed executions."""
from pathlib import Path
from collections import Counter
import json

ROOT = Path(__file__).resolve().parent

def read(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

def cases(suites, parents=()):
    for suite in suites:
        trail = parents + (suite.get("title", ""),)
        for spec in suite.get("specs", []):
            for test in spec.get("tests", []):
                yield trail + (spec["title"], test.get("projectName", "")), test
        yield from cases(suite.get("suites", []), trail)

expected = {key for key, _ in cases(read("regression-all-tests.json")["suites"])}
observed = {}
for filename in ["regression-standard-playwright.json", "regression-visual-playwright.json"]:
    report = read(filename)
    assert not report.get("errors"), "Global errors prevent a complete outcome"
    for key, test in cases(report["suites"]):
        assert key not in observed, f"Overlapping execution: {key}"
        assert test.get("results"), f"Missing result: {key}"
        state = test["results"][-1]["status"]
        assert state in ("passed", "failed", "timedOut", "skipped"), f"Incomplete result: {key}"
        observed[key] = state
assert set(observed) == expected, "Missing or unexpected execution identities"
aggregate = {key: test["results"][-1]["status"] for key, test in cases(read("regression-playwright.json")["suites"])}
assert aggregate == observed, "Aggregate altered primary results"
assert len(expected) == 951 and Counter(observed.values())["skipped"] == 24
print(f"Verified {len(expected)} unique full-suite executions; no missing/overlapping cases.")
print(dict(Counter(observed.values())))
print("Failures remain failures. Isolated rechecks do not replace primary results.")
