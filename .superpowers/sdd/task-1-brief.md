### Task 1: Workspace constants

**Files:**
- Create: `lib/ui/workspace.ts`
- Create: `lib/ui/workspace.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const WORKSPACE_LABEL = "Academic Workspace";
  export const SIDEBAR_WIDTH_CLASS = "w-80"; // 320px
  export const SIDEBAR_OFFSET_CLASS = "pl-80";
  export const TOP_BAR_HEIGHT_CLASS = "h-16";
  ```

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  SIDEBAR_OFFSET_CLASS,
  SIDEBAR_WIDTH_CLASS,
  TOP_BAR_HEIGHT_CLASS,
  WORKSPACE_LABEL,
} from "./workspace";

describe("workspace chrome constants", () => {
  it("uses Academic Workspace label", () => {
    expect(WORKSPACE_LABEL).toBe("Academic Workspace");
  });

  it("uses 320px sidebar width utilities", () => {
    expect(SIDEBAR_WIDTH_CLASS).toBe("w-80");
    expect(SIDEBAR_OFFSET_CLASS).toBe("pl-80");
    expect(TOP_BAR_HEIGHT_CLASS).toBe("h-16");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run lib/ui/workspace.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```ts
/** Shared chrome labels / Tailwind width contract (320px = w-80). */
export const WORKSPACE_LABEL = "Academic Workspace";
export const SIDEBAR_WIDTH_CLASS = "w-80";
export const SIDEBAR_OFFSET_CLASS = "pl-80";
export const TOP_BAR_HEIGHT_CLASS = "h-16";
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run lib/ui/workspace.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ui/workspace.ts lib/ui/workspace.test.ts
git commit -m "feat: add workspace chrome constants for dashboard UI"
```

---

