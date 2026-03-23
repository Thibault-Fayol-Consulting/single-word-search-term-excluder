# Single-Word Search Term Excluder

> Google Ads Script for SMBs — Auto-exclude single-word search terms that waste budget without converting

## What it does
Finds single-word search terms that spent above a configurable threshold without generating any conversions, then adds them as exact-match negatives at the ad group level. Single-word terms are the #1 budget leak in SMB Search accounts using broad or phrase match.

## Setup
1. Open Google Ads > Tools > Scripts
2. Create a new script and paste the code from `main_en.gs` (or `main_fr.gs` for French)
3. Update the `CONFIG` block at the top:
   - `EMAIL`: your alert email
   - `TEST_MODE`: set to `false` when ready to add negative keywords
   - `COST_THRESHOLD_MICROS`: minimum spend to trigger exclusion (default $5.00)
4. Authorize and run a preview first
5. Schedule: **Weekly**

## CONFIG reference
| Parameter | Default | Description |
|-----------|---------|-------------|
| `TEST_MODE` | `true` | `true` = log only, `false` = add negatives + send email |
| `EMAIL` | `contact@domain.com` | Email address for exclusion alerts |
| `COST_THRESHOLD_MICROS` | `5000000` | Minimum spend in micros to flag ($5.00) |
| `LOOKBACK` | `LAST_30_DAYS` | Analysis window |
| `MIN_IMPRESSIONS` | `10` | Minimum impressions to consider a term |

## How it works
1. Queries `search_term_view` via GAQL for terms above the cost threshold with zero conversions
2. Filters for single-word terms (no spaces)
3. Adds each term as an exact-match negative keyword `[term]` at the ad group level via `createNegativeKeyword()`
4. Sends a summary email listing all excluded terms

## Requirements
- Google Ads account (not MCC)
- Google Ads Scripts access
- Active Search campaigns

## License
MIT — Thibault Fayol Consulting
