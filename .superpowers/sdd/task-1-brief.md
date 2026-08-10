### Task 1: Background registry + asset

**Files:**
- Create: `lib/sheet-backgrounds.ts`
- Create: `lib/sheet-backgrounds.test.ts`
- Create: `public/backgrounds/kids-frame.png` (copy from chat attachment `math_background-â€¦.png`; if missing, ask user to re-attach)

**Interfaces:**
- Produces: `SHEET_BACKGROUNDS`, `SheetBackgroundId`, `DEFAULT_SHEET_BACKGROUND_ID`, `SHEET_BACKGROUND_OPTIONS`, `isSheetBackgroundId`, `getSheetBackground`

- [ ] **Step 1: Write the failing test**

```ts
// lib/sheet-backgrounds.test.ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHEET_BACKGROUND_ID,
  SHEET_BACKGROUNDS,
  getSheetBackground,
  isSheetBackgroundId,
} from "./sheet-backgrounds";

describe("sheet backgrounds", () => {
  it("defaults to blank", () => {
    expect(DEFAULT_SHEET_BACKGROUND_ID).toBe("blank");
    expect(getSheetBackground().src).toBeNull();
    expect(getSheetBackground().showPageBorder).toBe(true);
  });

  it("includes kids-frame without page border", () => {
    expect(SHEET_BACKGROUNDS["kids-frame"]).toMatchObject({
      id: "kids-frame",
      label: "Kids frame",
      src: "/backgrounds/kids-frame.png",
      showPageBorder: false,
    });
  });

  it("falls back to blank for unknown ids", () => {
    expect(getSheetBackground("nope" as "blank").id).toBe("blank");
  });

  it("validates ids", () => {
    expect(isSheetBackgroundId("blank")).toBe(true);
    expect(isSheetBackgroundId("kids-frame")).toBe(true);
    expect(isSheetBackgroundId("x")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/sheet-backgrounds.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement registry**

```ts
// lib/sheet-backgrounds.ts
export const SHEET_BACKGROUNDS = {
  blank: {
    id: "blank",
    label: "Blank",
    src: null as string | null,
    showPageBorder: true,
  },
  "kids-frame": {
    id: "kids-frame",
    label: "Kids frame",
    src: "/backgrounds/kids-frame.png",
    showPageBorder: false,
  },
} as const;

export type SheetBackgroundId = keyof typeof SHEET_BACKGROUNDS;
export type SheetBackground = (typeof SHEET_BACKGROUNDS)[SheetBackgroundId];

export const DEFAULT_SHEET_BACKGROUND_ID: SheetBackgroundId = "blank";

export const SHEET_BACKGROUND_OPTIONS = Object.values(
  SHEET_BACKGROUNDS,
) as SheetBackground[];

export function isSheetBackgroundId(value: string): value is SheetBackgroundId {
  return value in SHEET_BACKGROUNDS;
}

export function getSheetBackground(
  id: SheetBackgroundId | string = DEFAULT_SHEET_BACKGROUND_ID,
): SheetBackground {
  if (isSheetBackgroundId(id)) return SHEET_BACKGROUNDS[id];
  return SHEET_BACKGROUNDS.blank;
}
```

Fix the fallback test to call `getSheetBackground("nope")` with a `string` param (signature above accepts `string`).

- [ ] **Step 4: Copy asset**

```powershell
New-Item -ItemType Directory -Force -Path public/backgrounds
# Copy from Cursor assets path if present; otherwise ask user to drop the PNG again
Copy-Item "<source-math_background.png>" public/backgrounds/kids-frame.png
```

Confirm: `Test-Path public/backgrounds/kids-frame.png` â†’ `True`

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/sheet-backgrounds.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/sheet-backgrounds.ts lib/sheet-backgrounds.test.ts public/backgrounds/kids-frame.png
git commit -m "feat: add sheet background registry and kids-frame asset"
```

---


