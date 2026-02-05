# DOCUMENT FILING SYSTEM STANDARD v4.2 (LLM/AI-ASSISTANT FRIENDLY)

**Document ID:** 6767-DR-STND-document-filing-system-v4-2
**Version:** 4.2
**Applies To:** This repository (irsb-solver)
**Default Timezone:** America/Chicago
**Status:** Active

---

## 1. Purpose

This standard defines how documents are named and organized in `000-docs/`. The system is designed to be:
- **Flat**: No subdirectories under `000-docs/`
- **Chronological**: Project docs use sequential numbering
- **Canonical**: Standards use fixed prefix `6767`
- **Parseable**: Both humans and LLMs can extract metadata from filenames

---

## 2. Directory Structure

```
000-docs/           # FLAT - no subdirectories allowed
├── 6767-*.md       # Canonical standards (prefix never changes)
├── 001-*.md        # First project doc
├── 002-*.md        # Second project doc
└── NNN-*.md        # Nth project doc (chronological)
```

**Hard Rule:** `000-docs/` must remain strictly flat. No nested folders.

---

## 3. Filename Families

### 3.1 Project Documents

Format: `NNN-CC-ABCD-short-description.ext`

| Component | Description | Example |
|-----------|-------------|---------|
| `NNN` | 3-digit sequence number (chronological) | `001`, `042`, `999` |
| `CC` | 2-letter category code (see §4) | `DR`, `AA`, `TM` |
| `ABCD` | 4-letter type code (see §5) | `INDX`, `REPT`, `SPEC` |
| `short-description` | Kebab-case description | `repo-docs-index` |
| `.ext` | File extension | `.md`, `.pdf` |

**Examples:**
- `001-DR-INDX-repo-docs-index.md`
- `002-AA-REPT-phase-1-scaffold.md`
- `003-TM-SPEC-threat-model-v1.md`

### 3.2 Canonical Standards

Format: `6767-[TOPIC-]CC-ABCD-short-description.ext`

| Component | Description | Example |
|-----------|-------------|---------|
| `6767` | Fixed prefix (never changes) | `6767` |
| `[TOPIC-]` | Optional topic qualifier | `DOCS-`, `SEC-` |
| `CC` | 2-letter category code | `DR`, `TM` |
| `ABCD` | 4-letter type code | `STND`, `SPEC` |
| `short-description` | Kebab-case description | `document-filing-system-v4-2` |

**Examples:**
- `6767-DR-STND-document-filing-system-v4-2.md` (this file)
- `6767-SEC-STND-secrets-handling.md`

---

## 4. Category Codes (CC)

| Code | Category | Use For |
|------|----------|---------|
| `DR` | Documentation | Standards, indexes, guides |
| `AA` | After-Action | AARs, retrospectives, post-mortems |
| `TM` | Technical Model | Threat models, architecture docs |
| `AD` | Architecture Decision | ADRs |
| `OP` | Operations | Runbooks, playbooks |
| `RP` | Report | Status reports, audits |
| `PL` | Plan | Project plans, roadmaps |

---

## 5. Type Codes (ABCD)

| Code | Type | Use For |
|------|------|---------|
| `INDX` | Index | Document indexes, catalogs |
| `STND` | Standard | Standards, conventions |
| `SPEC` | Specification | Technical specs, schemas |
| `REPT` | Report | AARs, status reports |
| `GUID` | Guide | How-to guides, tutorials |
| `RUNB` | Runbook | Operational procedures |
| `ARCH` | Architecture | Architecture docs, ADRs |
| `MODL` | Model | Threat models, data models |

---

## 6. Sequencing Rules

1. **Project docs**: Assign next available `NNN` (001, 002, 003...)
2. **Standards**: Always use `6767` prefix (does not increment)
3. **No gaps**: If `003` exists, next is `004`
4. **No reuse**: Deleted doc numbers are not reused

---

## 7. Examples Table

| Filename | Purpose |
|----------|---------|
| `6767-DR-STND-document-filing-system-v4-2.md` | This standard |
| `001-DR-INDX-repo-docs-index.md` | Repository document index |
| `002-AA-REPT-phase-1-scaffold.md` | Phase 1 after-action report |
| `003-TM-MODL-threat-model-v1.md` | Threat model document |
| `004-AD-ARCH-tech-stack-decision.md` | ADR for tech stack |

---

## 8. Validation Checklist

Before committing a new doc to `000-docs/`:

- [ ] Filename matches pattern `NNN-CC-ABCD-*.ext` or `6767-*`
- [ ] `000-docs/` remains flat (no subdirectories created)
- [ ] Sequence number is next available (no gaps, no reuse)
- [ ] Category code (CC) is from approved list
- [ ] Type code (ABCD) is from approved list
- [ ] Description is kebab-case and meaningful

---

## 9. LLM/AI Integration Notes

This standard is designed for AI assistants:
- Filenames are self-documenting
- Regex patterns can extract metadata
- Chronological ordering enables "latest" queries
- Category/type codes enable filtering

**Extraction regex:**
```regex
^(\d{3}|6767)-([A-Z]{2})-([A-Z]{4})-(.+)\.(\w+)$
```

Groups: (1) sequence/prefix, (2) category, (3) type, (4) description, (5) extension

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 4.2 | 2025-02-04 | Initial version for irsb-solver |

---

*End of Document*
