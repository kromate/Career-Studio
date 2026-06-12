# Deterministic Scoring Specification

## Core Rule

The numeric score is calculated by a versioned deterministic rules engine.
Generative AI is not part of the score calculation.

For the same:

- canonical resume content;
- parser version;
- scoring version;
- taxonomy version; and
- optional normalized job description;

the complete result must be byte-for-byte equivalent after canonical JSON
serialization.

## Two Scores

### Resume Quality Score

A 0-100 assessment that does not require a job description.

Proposed v1 dimensions:

| Dimension | Points | Examples |
| --- | ---: | --- |
| Parseability | 20 | extractable text, recognized sections, contact fields, date/role structure |
| Completeness | 15 | expected sections appropriate to career stage |
| Evidence and impact | 25 | outcomes, scope, ownership, quantified evidence |
| Clarity and brevity | 15 | bullet length, weak phrasing, redundancy, readability |
| Consistency | 10 | dates, tense, punctuation, headings, chronology |
| Searchability | 10 | explicit skills, standard titles, useful terminology |
| Mechanics | 5 | spelling, obvious grammar, placeholders, malformed text |

### Job Match Score

A separate 0-100 assessment requiring a normalized job description.

Proposed v1 dimensions:

| Dimension | Points |
| --- | ---: |
| Required skill coverage | 30 |
| Responsibility coverage | 25 |
| Experience and seniority alignment | 20 |
| Title and domain alignment | 10 |
| Preferred skill coverage | 10 |
| Education and certification alignment | 5 |

Required qualifications weigh more than preferred qualifications. Repeated
keywords do not earn repeated credit.

## Processing Contract

Each analysis stores:

```json
{
  "sourceFileHash": "sha256:...",
  "canonicalContentHash": "sha256:...",
  "jobDescriptionHash": "sha256:... or null",
  "parserVersion": "resume-parser-v1.0.0",
  "scoringVersion": "resume-quality-v1.0.0",
  "taxonomyVersion": "skills-v1.0.0",
  "score": 0,
  "dimensions": [],
  "checks": [],
  "parseWarnings": []
}
```

An exact source file hash may use a cached analysis. Different files that
produce the same canonical content hash use the same scoring input.

## Canonicalization

Before hashing or scoring:

1. Normalize Unicode to NFC.
2. Normalize line endings to `\n`.
3. Remove extraction-only control characters.
4. Preserve section, bullet, and page boundaries.
5. Normalize insignificant whitespace without changing words.
6. Parse dates into explicit values while retaining original text.
7. Sort unordered metadata keys before canonical JSON serialization.

The parser must not use a generative model to decide the canonical text.
Ambiguous classifications are represented with warnings and confidence values.

## Rule Shape

Every rule has:

- stable rule ID;
- scoring version;
- dimension;
- maximum points;
- deterministic input selector;
- deterministic evaluation function;
- evidence locations;
- pass/fail or bounded partial-credit result;
- user-facing explanation key;
- remediation key.

Example:

```json
{
  "ruleId": "impact.quantified-outcomes",
  "dimension": "impact",
  "maxPoints": 6,
  "earnedPoints": 3,
  "evidence": [
    {
      "sectionId": "experience-2",
      "bulletId": "bullet-4"
    }
  ]
}
```

Explanations may be rendered from deterministic templates. AI may provide an
optional expanded explanation, but it cannot change rule evidence or points.

## Parse Confidence

Parseability is both a scored dimension and a gate.

- `high`: normal report
- `medium`: report includes prominent extraction warnings
- `low`: do not show a normal overall score; request a corrected file or user
  confirmation of the extracted structure

This prevents a broken parser result from appearing to be a weak resume.

## Keyword and Skill Matching

Matching uses a versioned taxonomy of canonical skills, aliases, and related
terms. Exact phrases and approved aliases receive deterministic credit.

Semantic matching may be added only if:

- the embedding model and revision are pinned;
- vector normalization and similarity thresholds are versioned;
- repeated runs are reproducible within a defined tolerance;
- semantic credit is explainable with source evidence.

Keyword stuffing is controlled by:

- awarding coverage once per requirement;
- requiring evidence in an appropriate resume section;
- capping generic skills;
- flagging unnatural repetition separately.

## AI Rewrite Contract

The rewrite system receives structured resume evidence and a list of findings.
It returns suggestions, not direct mutations.

Each suggestion contains:

- source text;
- proposed text;
- addressed rule IDs;
- facts used;
- potential new facts requiring confirmation;
- expected deterministic point change;
- user decision.

The app rescans accepted text. It never assigns the expected score directly.

For repeatability of suggestions, a generated response is cached by canonical
input hash, target-job hash, prompt version, and model version. Scores remain
repeatable even if a user explicitly requests a new creative suggestion.

## Versioning

A score can change without resume edits only when one of its declared versions
changes. The UI must:

- display the scoring version;
- retain historical analyses;
- distinguish content changes from methodology changes;
- offer an explicit re-score under a newer version;
- publish a scoring changelog.

Never silently replace an old score with a newly calculated one.

## Required Tests

1. Golden fixtures with expected per-rule outputs
2. One hundred repeated analyses of each fixture
3. Cross-process and cross-machine reproducibility tests
4. PDF and DOCX canonicalization fixtures
5. Cache hit/miss tests for source and canonical hashes
6. Rule-boundary and rounding tests
7. Keyword repetition and stuffing tests
8. Low-confidence parse gating tests
9. Scoring-version migration snapshots
10. Rewrite tests that reject unsupported new facts

Release criterion: no fixture may produce a score or rule-result difference
across repeated runs under the same declared versions.

## Honest Naming

Use:

- Career Studio Resume Quality Score
- Career Studio Job Match Score
- ATS Readability or Parseability

Do not call the result the score assigned by Workday, Greenhouse, Lever, or all
ATS products. Rezi's own methodology documentation correctly notes that real
ATS products do not expose one universal official resume score:
[Rezi Score explained](https://www.rezi.ai/rezi-docs/the-rezi-score-explained).
