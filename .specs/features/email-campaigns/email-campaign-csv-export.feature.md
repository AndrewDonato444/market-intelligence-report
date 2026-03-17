---
feature: Email Campaign CSV Export
domain: email-campaigns
source: components/reports/email-viewer.tsx
tests: []
components:
  - EmailCampaignViewer
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: specced
created: 2026-03-17
updated: 2026-03-17
drift_reconciled: 2026-03-17
---

# Email Campaign CSV Export

**Source File**: components/reports/email-viewer.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: Email Campaign CSV Export

Export the full generated email campaign as a single downloadable CSV file — all 6 content types normalized into consistent columns. No server round-trip: generation and download are entirely client-side. Eliminates the need to copy individual items one at a time.

Taylor (Team Leader) needs to drop the full campaign into a shared doc for 10 agents at once. Alex (Rising Star) wants to import drip sequences directly into their CRM. Jordan (Established Practitioner) wants a structured file they can filter in Excel before choosing what to send.

---

### Scenario: Export all campaign content as a single CSV
Given a completed email campaign is being viewed
When the user clicks "Export CSV" in the viewer header
Then a CSV file is downloaded to the user's device
And the filename is `email-campaign-{reportId}.csv`
And the file contains a header row: `Section, Context, Subject / Headline, Preview Text, Body, CTA Idea`
And every content item across all 6 sections is included as a row
And the download triggers immediately with no server request

### Scenario: Drip sequence rows in CSV
Given the campaign has a drip sequence
When the CSV is generated
Then each drip email appears as one row:
  | Column             | Value                               |
  | Section            | "Drip Sequence"                     |
  | Context            | "Day {dayOffset} - {reportSection}" |
  | Subject / Headline | email subject line                  |
  | Preview Text       | email preview text                  |
  | Body               | full email body                     |
  | CTA Idea           | email cta text                      |
And rows are ordered by sequenceOrder ascending
And the reportSection value in the Context column is the raw snake_case string (not humanised)

### Scenario: Newsletter rows in CSV
Given the campaign has a newsletter
When the CSV is generated
Then the newsletter header appears as one row:
  | Column             | Value                  |
  | Section            | "Newsletter"           |
  | Context            | "Header"               |
  | Subject / Headline | newsletter headline    |
  | Preview Text       | newsletter subheadline |
  | Body               | (empty)                |
  | CTA Idea           | newsletter footerCta   |
And each content block appears as its own row:
  | Column             | Value                  |
  | Section            | "Newsletter Block"     |
  | Context            | block heading          |
  | Subject / Headline | block heading          |
  | Preview Text       | block keyMetric        |
  | Body               | block body             |
  | CTA Idea           | (empty)                |

### Scenario: Persona email rows in CSV
Given the campaign has persona-targeted emails
When the CSV is generated
Then each persona email appears as one row:
  | Column             | Value                  |
  | Section            | "Persona Email"        |
  | Context            | persona name           |
  | Subject / Headline | email subject          |
  | Preview Text       | email preview text     |
  | Body               | full email body        |
  | CTA Idea           | email cta              |

### Scenario: Subject line variant rows in CSV
Given the campaign has subject line sets
When the CSV is generated
Then each variant across all sets appears as one row:
  | Column             | Value                             |
  | Section            | "Subject Line"                    |
  | Context            | "{emailContext} - {style label}"  |
  | Subject / Headline | variant subject                   |
  | Preview Text       | variant preview text              |
  | Body               | (empty)                           |
  | CTA Idea           | (empty)                           |
And style labels are human-readable: "Data-Forward", "Curiosity", "Urgency"

### Scenario: CTA block rows in CSV
Given the campaign has CTA blocks
When the CSV is generated
Then each CTA block appears as one row:
  | Column             | Value                  |
  | Section            | "CTA Block"            |
  | Context            | placement label        |
  | Subject / Headline | button text            |
  | Preview Text       | supporting copy        |
  | Body               | context note           |
  | CTA Idea           | (empty)                |

### Scenario: Re-engagement email rows in CSV
Given the campaign has re-engagement templates
When the CSV is generated
Then each template appears as one row:
  | Column             | Value                  |
  | Section            | "Re-Engagement"        |
  | Context            | tone label             |
  | Subject / Headline | hook text              |
  | Preview Text       | (empty)                |
  | Body               | full email body        |
  | CTA Idea           | cta text               |

### Scenario: Cell values with commas or quotes are escaped correctly
Given any field contains commas, double quotes, or line breaks
When the CSV is generated
Then those cells are wrapped in double quotes
And any internal double quotes are escaped as ""
And line breaks within body text are preserved inside quoted cells
And the file opens correctly in Excel and Google Sheets without broken columns

### Scenario: Export button placement and styling
Given the user is viewing the email campaign viewer header
Then an "Export CSV" button appears right-aligned in the viewer header area
And it uses border/muted styling (secondary action, not primary)
And clicking it does not navigate away or reload the page

---

## User Journey

1. Agent generates email campaign
2. Campaign loads in viewer (existing flow)
3. **Agent clicks "Export CSV" in the header**
4. **Browser downloads `email-campaign-{reportId}.csv` immediately**
5. Agent opens file in Excel, Numbers, or Google Sheets
6. Agent filters/sorts by Section column to focus on drip sequence
7. Agent imports rows into CRM or pastes into shared team doc

---

## UI Mockup

```
┌──────────────────────────────────────────────────────────────┐
│                                          [Export CSV]        │  ← right-aligned, secondary style
├──────────────────────────────────────────────────────────────┤
│  PROPOSED EMAIL SEQUENCE (5)                       [↻]       │  ← per-section refresh
│  ...cards...                                                 │
│                                                              │
│  MARKET INTELLIGENCE NEWSLETTER (1)                [↻]       │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
Note: Navigation context ("← Back to Report") is provided by the
Content Studio page header, not the viewer itself.

CSV Output (email-campaign-{reportId}.csv):
┌──────────────────┬──────────────────┬──────────────────┬─────────────────┬───────────────────────────┬──────────────────────────────┐
│ Section          │ Context          │ Subject/Headline │ Preview Text    │ Body                      │ CTA Idea                     │
├──────────────────┼──────────────────┼──────────────────┼─────────────────┼───────────────────────────┼──────────────────────────────┤
│ Drip Sequence    │ Day 0 · exec_... │ Naples Luxury... │ Based on our... │ Dear [Name], The latest...│ View the full intel brief    │
│ Drip Sequence    │ Day 3 · narrative│ The SFR Premium..│ Single-family...│ The data is clear...      │ See your market position     │
│ Newsletter       │ Header           │ Naples Ultra-Lux │ What the late...│                           │ Schedule a market briefing   │
│ Newsletter Block │ Waterfront Prem. │ Waterfront Prem. │ $6.58B          │ Total luxury volume...    │                              │
│ Persona Email    │ PE Principal     │ The ROI case...  │ Tax efficiency..│ When capital is mobile...  │ Review the full brief        │
│ Subject Line     │ Drip 1 · Curiosity│ Is your market..│ The answer may.│                           │                              │
│ CTA Block        │ Primary          │ Schedule Briefing│ Get a personal..│ End of drip sequence      │                              │
│ Re-Engagement    │ Warm             │ While most mark..│                 │ Three months ago...        │ Reply "interested"           │
└──────────────────┴──────────────────┴──────────────────┴─────────────────┴───────────────────────────┴──────────────────────────────┘
```

---

## Implementation Notes

- **Pure client-side**: Build the CSV string in memory, create a `Blob`, use `URL.createObjectURL` + a hidden `<a>` click to trigger the download. Zero API calls.
- **Filename**: `email-campaign-${reportId}.csv`
- **Encoding**: UTF-8 with BOM (`\uFEFF`) prefix so Excel opens it correctly without garbling characters
- **RFC 4180 escaping**: Wrap any cell containing `,` `"` or `\n` in double quotes; escape internal `"` as `""`
- **Section order in CSV**: Drip Sequence → Newsletter (header + blocks) → Persona Emails → Subject Lines → CTA Blocks → Re-Engagement (mirrors viewer section order)
- **Empty cells**: Render as empty string, not "N/A" or "-" — keeps the file clean for CRM import

---

## Learnings

##