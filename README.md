# Sentinel Forge AI

Sentinel Forge AI is a defensive cybersecurity AI project that runs entirely in the browser. It ingests security telemetry, extracts suspicious behavior signals, correlates events into incidents, explains why each incident matters, maps evidence to MITRE-style tactics, and generates response playbooks.

## What it does

- Parses JSON arrays, JSONL-style logs, or raw pasted security lines.
- Scores events with a local explainable triage engine.
- Correlates identity, endpoint, network, and cloud signals into incidents.
- Builds an attack-path graph for the highest-risk chain.
- Provides a case-aware co-pilot for summaries, containment, blast radius, and evidence preservation.
- Exports a JSON incident report for handoff.

## How to run

Open `index.html` in a browser. No package install is required.

## Safe-use note

This project is defensive by design. It does not exploit systems, scan targets, collect credentials, or provide offensive automation. Its purpose is security monitoring, triage, and incident response practice.

## Suggested next upgrades

- Add a backend connector for SIEM sources such as Splunk, Elastic, Sentinel, or Chronicle.
- Connect an approved LLM API for richer natural-language summaries.
- Store historical baselines per user, host, and destination.
- Add analyst case management and ticket export.
