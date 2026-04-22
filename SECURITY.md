# Security Notes

## Current Risk Summary

This repository currently contains operational school application code and also tracks real or realistic school-related data files and reference documents.

Examples already present in the repository include:

- teacher contact details
- student names
- guardian phone numbers
- dates of birth
- student identity numbers
- school workflow reference documents

Because of that, this repository should be treated as sensitive unless the tracked data is reviewed, reduced, anonymized, or moved out of version control.

## Secrets Handling

Do not commit live secrets into source files.

This includes:

- Telegram bot tokens
- Fonnte tokens
- Cloudflare secrets
- Google OAuth secrets
- admin-only API keys

Use local configuration, platform secrets, or runtime configuration sheets instead of hardcoding values in tracked files.

## History Warning

Hardcoded notification values existed in earlier commits and were later removed.
If those credentials were real, they should be considered exposed and rotated.

Recommended actions:

1. Rotate any Telegram, Fonnte, Cloudflare, or related credentials that were ever committed.
2. Review repository history before treating this repository as safe for broad sharing.
3. If this repository is intended to become public, rewrite Git history first to remove exposed secrets and sensitive data.

## Data Governance

Before sharing this repository outside the trusted team, review tracked files such as:

- `data_murid.csv`
- `data_guru.csv`
- `data_harilahir.csv`
- `.xlsx` school exports
- `.docx` source documents

If possible:

1. replace them with anonymized fixtures
2. move private operational data to secured storage
3. keep only templates or sample data in Git

## Safer Collaboration Baseline

- keep `.clasp.json` local only
- keep generated deploy artifacts out of Git
- prefer empty defaults for notification settings in source code
- store production configuration in approved backend/config channels

