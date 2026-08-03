import { additionBlankMeta } from "./addition-blank/meta";
import { subtractionBlankMeta } from "./subtraction-blank/meta";
import { missingAddendMeta } from "./missing-addend/meta";
import { missingSubtrahendMeta } from "./missing-subtrahend/meta";
import { doublesAdditionMeta } from "./doubles-addition/meta";
import { makeTenMeta } from "./make-ten/meta";
import { verticalAdditionMeta } from "./vertical-addition/meta";
import { verticalSubtractionMeta } from "./vertical-subtraction/meta";
import { tenMoreMeta } from "./ten-more/meta";
import { tenLessMeta } from "./ten-less/meta";
import { tensOnesMeta } from "./tens-ones/meta";
import { compareNumbersMeta } from "./compare-numbers/meta";
import { beforeAfterMeta } from "./before-after/meta";
import { numberSequenceMeta } from "./number-sequence/meta";
import { skipCount2Meta } from "./skip-count-2/meta";
import { skipCount5Meta } from "./skip-count-5/meta";
import { skipCount10Meta } from "./skip-count-10/meta";
import { tenFrameCountMeta } from "./ten-frame-count/meta";
import { analogTimeHourMeta } from "./analog-time-hour/meta";
import { shapeSidesMeta } from "./shape-sides/meta";
import { longerShorterMeta } from "./longer-shorter/meta";
import type { ProblemTypeEntry } from "./types";

export const problemTypes: ProblemTypeEntry[] = [
  additionBlankMeta,
  subtractionBlankMeta,
  missingAddendMeta,
  missingSubtrahendMeta,
  doublesAdditionMeta,
  makeTenMeta,
  verticalAdditionMeta,
  verticalSubtractionMeta,
  tenMoreMeta,
  tenLessMeta,
  tensOnesMeta,
  compareNumbersMeta,
  beforeAfterMeta,
  numberSequenceMeta,
  skipCount2Meta,
  skipCount5Meta,
  skipCount10Meta,
  tenFrameCountMeta,
  analogTimeHourMeta,
  shapeSidesMeta,
  longerShorterMeta,
];
