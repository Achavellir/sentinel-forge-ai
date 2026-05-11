# Achavelli Personal Assistant

Achavelli is a local-first personal assistant app for Mac and iPhone. It is built as a progressive web app with an Apple-style interface, local storage, voice input where the browser supports it, a doctorate research desk, and an authorized-scope bug bounty lab.

## Run

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Current version

- Command stack for priorities.
- Quick capture and memory.
- Chat-style assistant with local planning logic.
- Voice-lock phrase gate before voice commands.
- Job command center with resume profile, detailed resume-to-job match %, fit scoring, application packets, status counts, assessment/interview tracking, and CSV export.
- Research paper blueprint generator.
- Bug bounty assessment helper with an authorization gate.
- Permission toggles with cards and wallets locked.
- Export to JSON.
- PWA manifest and service worker.

## Next build step

Add a private backend for real AI model calls, biometric speaker verification, account authentication, encrypted cloud sync, Gmail/Calendar/Drive connectors, and native iOS/macOS wrappers.
