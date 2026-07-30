---
target: landing page
total_score: 30
p0_count: 0
p1_count: 2
p2_count: 3
timestamp: 2026-06-01T03-01-16Z
slug: frontend-src-pages-landingpage-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | DemoSection animation gives status; no sign-up loading state defined |
| 2 | Match System / Real World | 4 | Medical terms native throughout |
| 3 | User Control and Freedom | 2 | One-directional scroll; single anchor nav link |
| 4 | Consistency and Standards | 3 | Hero CTA "Começar grátis" vs final "Criar conta grátis" — same action, different label |
| 5 | Error Prevention | 3 | FAQ pre-empts misconceptions; limited form surface |
| 6 | Recognition Rather Than Recall | 4 | Everything visible; minimal nav |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; one anchor link |
| 8 | Aesthetic and Minimalist Design | 3 | Credential cards identical; emoji on features add noise |
| 9 | Help / Recover from Errors | 3 | FAQ direct; email in footer |
| 10 | Help and Documentation | 3 | FAQ covers 5 key doubts |
| **Total** | | **30/40** | **Good** |

## Anti-Patterns Verdict

CLI detector unavailable (bundled detector not installed). Manual scan conducted.

Findings:
- Identical card grid: ProvaSection credential grid (PCDTs/CFM/SUS/BR — 4 identical bordered cards)
- Em dash violations: 4 instances in HeroSection.jsx, DorSection.jsx, DemoSection.jsx, FeaturesSection.jsx
- Feature card background regression: .card background changed from $color-bg to $color-surface (white-on-white)
- sectionLabel repetition: 5 remaining instances across DemoSection, FeaturesSection, ProvaSection, PrecosSection, CtaFinalSection

## Priority Issues

[P1] Feature card background regression — cards invisible on white section
Fix: .card { background: $color-bg; } — one line

[P1] ProvaSection credential grid is an identical card anti-pattern
Fix: Replace with typographic treatment — large acronyms in ruled horizontal list

[P2] Four em dashes in visible copy
Fix: Replace each with comma, colon, or semicolon

[P2] sectionLabel pattern on 5 of 8 sections — brand ban
Fix: Remove all except PrecosSection and CtaFinalSection

[P2] Hero right column preview widget floats with dead whitespace
Fix: align-items: start in .inner

## Persona Red Flags

Jordan: Demo case buried below fold; best conversion argument not seen without scrolling
Casey: Mobile 5-line headline fills screen; feature cards single-column = excessive scroll
Dra. Ana: Knowledge graph differentiator never mentioned; no accuracy disclaimer

## Minor Observations
- DemoSection chatBar still has em dash
- ProvaSection title ends with period
- Two consecutive dark sections create unbroken dark block
- Feature card emojis informal for clinical context
- Success color (green) on "Hipótese principal" is medication semantic, not diagnosis semantic
