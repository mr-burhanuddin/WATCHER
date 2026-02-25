## Strong AI Signals (count as AI)

- Large syntactically complete blocks added at once
- Consistent naming across unrelated logic
- Uniform formatting and structure across many lines
- Verbose defensive checks added together
- Pattern-complete implementations without incremental edits

## Strong Human Signals (count as HUMAN)

- Small incremental edits
- Partial refactors
- Renames or variable tweaks
- Inconsistent style within nearby lines
- Manual fixes or patch-like changes

## UNCERTAIN (default to HUMAN)

- AI-generated code that was edited
- Mixed formatting within the same block
- Logic rewritten partially
- Formatting + logic changes combined

UNCERTAIN lines MUST be counted as HUMAN in final percentages.
