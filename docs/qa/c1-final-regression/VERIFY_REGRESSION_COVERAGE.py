"""Verify the complete partition union; never replace failures with rechecks."""
from collections import Counter
from pathlib import Path
import copy
import datetime as dt
import hashlib
import json
import sys

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[3] / "artifacts/c1-final-regression"


def read(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8-sig"))


def cases(suites, parents=()):
    for suite in suites:
        trail = parents + (suite.get("title", ""),)
        for spec in suite.get("specs", []):
            for test in spec.get("tests", []):
                yield trail + (spec["title"], test.get("projectName", "")), test
        yield from cases(suite.get("suites", []), trail)


listed = list(cases(read("regression-all-tests.json")["suites"]))
expected = {key for key, _ in listed}
assert len(listed) == len(expected), "Duplicate identities in inventory"
assert len(expected) == 954, len(expected)  # Original 951 plus one new case in three projects.
original = read("../c1-review-revisions/regression-all-tests.json")
original_keys = {key for key, _ in cases(original["suites"])}
assert len(original_keys) == 951 and original_keys <= expected, "Original tests removed or renamed"
observed = {}
executions = {}
parts = []
starts, ends = [], []
for name in ["regression-standard.json", "regression-visual.json"]:
    report = read(name)
    assert not report.get("errors") and not report["stats"]["flaky"], "Global errors/flaky execution"
    counts = Counter()
    for key, test in cases(report["suites"]):
        assert key in expected and key not in observed, f"Unexpected/duplicated identity: {key}"
        results = test.get("results", [])
        assert len(results) == 1 and results[0].get("retry", 0) == 0, f"Missing/repeated execution: {key}"
        state = results[0]["status"]
        assert state in ("passed", "failed", "timedOut", "skipped"), f"Incomplete result: {key}"
        observed[key] = state
        executions[key] = copy.deepcopy(test)
        counts[state] += 1
    start = dt.datetime.fromisoformat(report["stats"]["startTime"].replace("Z", "+00:00"))
    starts.append(start)
    ends.append(start + dt.timedelta(milliseconds=report["stats"]["duration"]))
    parts.append({"report": name, "sha256": hashlib.sha256((ROOT / name).read_bytes()).hexdigest(),
                  "counts": dict(counts), "test_count": sum(counts.values()),
                  "start_time": report["stats"]["startTime"], "duration_ms": report["stats"]["duration"]})
assert set(observed) == expected, "Missing execution identities"
counts = Counter(observed.values())
assert counts["skipped"] == 24, "Skip count changed"
original_skips = set()
for name in ["regression-standard.json", "regression-visual.json"]:
    for key, test in cases(read("../c1-review-revisions/" + name)["suites"]):
        if test["results"][-1]["status"] == "skipped":
            original_skips.add(key)
assert {key for key, state in observed.items() if state == "skipped"} == original_skips, "Intentional skip identities changed"
aggregate = read("regression-all-tests.json")
for key, test in cases(aggregate["suites"]):
    test.clear()
    test.update(executions[key])
aggregate["errors"] = []
aggregate["stats"] = {"startTime": min(starts).isoformat(), "duration": (max(ends) - min(starts)).total_seconds() * 1000,
                      "expected": counts["passed"], "unexpected": counts["failed"] + counts["timedOut"],
                      "skipped": counts["skipped"], "flaky": 0}
aggregate["execution"] = "DERIVED AGGREGATE: two disjoint primary executions; not one invocation"
aggregate["executionPartitions"] = parts
(ROOT / "regression-aggregate.json").write_text(json.dumps(aggregate, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
assert {key: test["results"][0]["status"] for key, test in cases(aggregate["suites"])} == observed
proof = {"expected": len(expected), "original_expected": len(original_keys), "added": len(expected - original_keys),
         "executed_unique": len(observed), "missing": [], "duplicated": [], "unexpected": [],
         "retry_count": 0, "original_skip_identities_unchanged": True,
         "outcomes": dict(counts), "passed": counts["passed"] == 930,
         "inventory_sha256": hashlib.sha256((ROOT / "regression-all-tests.json").read_bytes()).hexdigest(),
         "aggregate": "regression-aggregate.json", "aggregate_is_not_single_invocation": True,
         "method": "Two disjoint primary executions; never substitute isolated rechecks.", "partitions": parts}
(ROOT / "regression-coverage.json").write_text(json.dumps(proof, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(proof, ensure_ascii=False, indent=2))
