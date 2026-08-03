# Grade 1 problem types (text + light visuals)

**Date:** 2026-08-03  
**Status:** Approved for implementation  
**Scope:** Add 20 Grade 1 problem types; shared light visuals; generation via min/max

## Context

MathSheets currently has one problem type (`addition-blank`). Grade 1 curricula emphasize add/subtract within 20, place value to 100, counting sequences, comparison, measurement, shapes, and time (hour).

## Approach

Shared visual helpers + thin problem components (printable text/equation + answer blank). Extend `propsFromRange` / template add-item for every type.

## Types (20 new)

| id | Name | Visual |
|----|------|--------|
| subtraction-blank | Subtraction blank | — |
| missing-addend | Missing addend | — |
| missing-subtrahend | Missing subtrahend | — |
| doubles-addition | Doubles | — |
| make-ten | Make ten | ten-frame |
| vertical-addition | Vertical addition | rules |
| vertical-subtraction | Vertical subtraction | rules |
| ten-more | Ten more | — |
| ten-less | Ten less | — |
| tens-ones | Tens and ones | base-ten |
| compare-numbers | Compare numbers | — |
| before-after | Before and after | — |
| number-sequence | Fill the blank | — |
| skip-count-2 | Skip count by 2 | — |
| skip-count-5 | Skip count by 5 | — |
| skip-count-10 | Skip count by 10 | — |
| ten-frame-count | Count the ten-frame | ten-frame |
| analog-time-hour | Time to the hour | clock |
| shape-sides | Count the sides | shape |
| longer-shorter | Longer or shorter | bars |

## Shared visuals

`components/problems/visuals/`: ten-frame, base-ten, clock (hour), shape outline, length bars.

## Out of scope

Word problems, interactive inputs, answer keys.
