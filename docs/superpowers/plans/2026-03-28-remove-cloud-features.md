# Remove Cloud Features & Rebrand to OpenCohere — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip all cloud/account features (auth, subscriptions, referrals, cloud transcription) from the OpenCohere fork and rebrand to OpenCohere, keeping local and BYOK functionality intact.

**Architecture:** Surgical deletion of cloud-only files, IPC handlers, and preload methods, followed by simplification of shared files that had auth-conditional branches. BYOK paths are preserved untouched. Rebrand updates names/IDs throughout.

**Tech Stack:** Electron, React, TypeScript, Zustand (settings store), whisper.cpp/Parakeet (local STT)

**Spec:** `docs/superpowers/specs/2026-03-28-remove-cloud-features-design.md`

---

### Task 1: Delete Cloud-Only Components

**Files:**
- Delete: `src/components/AuthenticationStep.tsx`
- Delete: `src/components/EmailVerificationStep.tsx`
- Delete: `src/components/UsageDisplay.tsx`
- Delete: `src/components/UpgradePrompt.tsx`
- Delete: `src/components/ReferralDashboard.tsx`
- Delete: `src/components/ReferralModal.tsx`
- Delete: `src/components/ForgotPasswordView.tsx`
- Delete: `src/components/ResetPasswordView.tsx`
- Delete: `src/components/referral-cards/SpectrogramCard.tsx`
- Delete: `src/components/referral-cards/generateWaveform.ts`

- [ ] **Step 1: Delete all cloud-only component files**

```bash
rm src/components/AuthenticationStep.tsx
rm src/components/EmailVerificationStep.tsx
rm src/components/UsageDisplay.tsx
rm src/components/UpgradePrompt.tsx
rm src/components/ReferralDashboard.tsx
rm src/components/ReferralModal.tsx
rm src/components/ForgotPasswordView.tsx
rm src/components/ResetPasswordView.tsx
rm -rf src/components/referral-cards/
```

- [ ] **Step 2: Commit**

```bash
git add -u src/components/
git commit -m "chore: delete cloud-only components (auth, usage, referrals)"
```

---

### Task 2: Delete Cloud-Only Libraries and Hooks

**Files:**
- Delete: `src/lib/neonAuth.ts`
- Delete: `src/hooks/useAuth.ts`
- Delete: `src/hooks/useUsage.ts`

- [ ] **Step 1: Delete cloud auth library and hooks**

```bash
rm src/lib/neonAuth.ts
rm src/hooks/useAuth.ts
rm src/hooks/useUsage.ts
```

- [ ] **Step 2: Commit**

```bash
git add -u src/lib/ src/hooks/
git commit -m "chore: delete cloud auth library and hooks (neonAuth, useAuth, useUsage)"
```

---

### Task 3: Remove Cloud IPC Handlers from ipcHandlers.js

**Files:**
- Modify: `src/helpers/ipcHandlers.js`

Remove these IPC handler blocks (approximate line ranges from current file — use the handler name strings to locate precisely):

| Handler | ~Lines |
|---------|--------|
| `auth-clear-session` | 2113-2124 |
| `cloud-transcribe` | 2202-2270 |
| `cloud-reason` | 2761-2842 |
| `cloud-streaming-usage` | 2909-2956 |
| `cloud-usage` | 2958-2983 |
| `cloud-checkout` | 3018-3023 |
| `cloud-billing-portal` | 3018-3023 |
| `cloud-switch-plan` | 3026-3082 |
| `cloud-preview-switch` | 3055-3082 |
| `transcribe-audio-file-cloud` | 3111-3206 |
| `get-referral-stats` | 3343-3374 |
| `send-referral-invite` | 3376-3412 |
| `get-referral-invites` | 3414-3442 |

- [ ] **Step 1: Search for each handler by its string name and delete the full `ipcMain.handle(...)` block**

Search for each of these strings in `src/helpers/ipcHandlers.js`:
- `"auth-clear-session"`
- `"cloud-transcribe"`
- `"cloud-reason"`
- `"cloud-streaming-usage"`
- `"cloud-usage"`
- `"cloud-checkout"`
- `"cloud-billing-portal"`
- `"cloud-switch-plan"`
- `"cloud-preview-switch"`
- `"transcribe-audio-file-cloud"`
- `"get-referral-stats"`
- `"send-referral-invite"`
- `"get-referral-invites"`

For each one, delete from the `ipcMain.handle("handler-name"` line through the closing `});` of that handler. Be careful not to delete adjacent non-cloud handlers.

- [ ] **Step 2: Remove any helper functions only used by deleted handlers**

Search for functions like `getSessionCookies()`, `getApiUrl()`, or similar that are only called by the deleted cloud handlers. If they have no other callers, delete them too.

- [ ] **Step 3: Verify the file parses correctly**

```bash
node -c src/helpers/ipcHandlers.js
```

Expected: no syntax errors.

- [ ] **Step 4: Commit**

```bash
git add src/helpers/ipcHandlers.js
git commit -m "chore: remove cloud IPC handlers (auth, transcription, billing, referrals)"
```

---

### Task 4: Remove Cloud API Methods from preload.js

**Files:**
- Modify: `preload.js`

- [ ] **Step 1: Remove these lines from the `electronAPI` object in preload.js**

Delete these methods (lines ~375-401):

```javascript
// Delete this line:
authClearSession: () => ipcRenderer.invoke("auth-clear-session"),

// Delete this block (OpenCohere Cloud API):
cloudTranscribe: (audioBuffer, opts) => ipcRenderer.invoke("cloud-transcribe", audioBuffer, opts),
cloudReason: (text, opts) => ipcRenderer.invoke("cloud-reason", text, opts),
cloudStreamingUsage: (text, audioDurationSeconds, opts) =>
  ipcRenderer.invoke("cloud-streaming-usage", text, audioDurationSeconds, opts),
cloudUsage: () => ipcRenderer.invoke("cloud-usage"),
cloudCheckout: (opts) => ipcRenderer.invoke("cloud-checkout", opts),
cloudBillingPortal: () => ipcRenderer.invoke("cloud-billing-portal"),
cloudSwitchPlan: (opts) => ipcRenderer.invoke("cloud-switch-plan", opts),
cloudPreviewSwitch: (opts) => ipcRenderer.invoke("cloud-preview-switch", opts),

// Delete this block (Cloud audio file transcription):
transcribeAudioFileCloud: (filePath) =>
  ipcRenderer.invoke("transcribe-audio-file-cloud", filePath),

// Delete this block (Referral stats):
getReferralStats: () => ipcRenderer.invoke("get-referral-stats"),
sendReferralInvite: (email) => ipcRenderer.invoke("send-referral-invite", email),
getReferralInvites: () => ipcRenderer.invoke("get-referral-invites"),
```

Keep `getSttConfig` and `transcribeAudioFileByok` — those are BYOK.

Also delete the surrounding comment lines (`// OpenCohere Cloud API`, `// Cloud audio file transcription`, `// Referral stats`).

- [ ] **Step 2: Verify the file parses correctly**

```bash
node -c preload.js
```

Expected: no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add preload.js
git commit -m "chore: remove cloud/auth/referral API methods from preload"
```

---

### Task 5: Simplify OnboardingFlow (Remove Auth Step)

**Files:**
- Modify: `src/components/OnboardingFlow.tsx`

The current flow has 4 steps for non-signed-in users (Auth → Setup → Permissions → Activation) and 3 steps for signed-in users. We're removing auth entirely, so the new flow is 3 steps: Setup → Permissions → Activation.

- [ ] **Step 1: Remove auth-related imports (lines 28-29, 32)**

Delete these lines:
```typescript
import AuthenticationStep from "./AuthenticationStep";
import EmailVerificationStep from "./EmailVerificationStep";
import { useAuth } from "../hooks/useAuth";
```

- [ ] **Step 2: Remove `isSignedIn` and `skipAuth` usage from the component**

Remove line 48:
```typescript
const { isSignedIn } = useAuth();
```

Remove `skipAuth` state and `pendingVerificationEmail` state declarations (search for `const [skipAuth` and `const [pendingVerificationEmail`).

- [ ] **Step 3: Simplify `getMaxStep()` — now always 3 steps (indices 0-2)**

Replace:
```typescript
const getMaxStep = () => (isSignedIn ? 2 : 3);
```
With:
```typescript
const getMaxStep = () => 2;
```

- [ ] **Step 4: Simplify the `steps` array — remove the `isSignedIn` branch**

Replace the entire conditional steps definition (lines 126-138):
```typescript
const steps =
  isSignedIn && !skipAuth
    ? [
        { title: t("onboarding.steps.welcome"), icon: UserCircle },
        { title: t("onboarding.steps.setup"), icon: Settings },
        { title: t("onboarding.steps.activation"), icon: Command },
      ]
    : [
        { title: t("onboarding.steps.welcome"), icon: UserCircle },
        { title: t("onboarding.steps.setup"), icon: Settings },
        { title: t("onboarding.steps.permissions"), icon: Shield },
        { title: t("onboarding.steps.activation"), icon: Command },
      ];
```
With:
```typescript
const steps = [
  { title: t("onboarding.steps.setup"), icon: Settings },
  { title: t("onboarding.steps.permissions"), icon: Shield },
  { title: t("onboarding.steps.activation"), icon: Command },
];
```

Note: Removed the "welcome" step (that was the auth step labeled as welcome) and removed the `UserCircle` import from lucide-react.

- [ ] **Step 5: Fix `activationStepIndex`**

Replace:
```typescript
const activationStepIndex = isSignedIn && !skipAuth ? 2 : 3;
```
With:
```typescript
const activationStepIndex = 2;
```

- [ ] **Step 6: Simplify `saveSettings()` — remove auth localStorage and isSignedIn check**

In the `saveSettings` callback, remove these lines:
```typescript
const skippedAuth = skipAuth;
localStorage.setItem("authenticationSkipped", skippedAuth.toString());
localStorage.setItem("skipAuth", skippedAuth.toString());

if (!isSignedIn && !useLocalWhisper) {
  updateTranscriptionSettings({ cloudTranscriptionMode: "byok" });
}
```

Replace with (always default to BYOK for cloud mode):
```typescript
localStorage.setItem("onboardingCompleted", "true");

if (!useLocalWhisper) {
  updateTranscriptionSettings({ cloudTranscriptionMode: "byok" });
}
```

Remove `isSignedIn`, `skipAuth`, and their refs from the `useCallback` dependency array.

- [ ] **Step 7: Rewrite `renderStep()` — remove case 0 (auth) and renumber**

Replace the entire `renderStep()` switch with new case numbering:
- case 0: Setup (was case 1 non-signed-in branch — the `TranscriptionModelPicker` block)
- case 1: Permissions (was case 2 non-signed-in branch)
- case 2: Activation (was case 3)

Remove the entire auth case (case 0 with `AuthenticationStep` and `EmailVerificationStep`), the signed-in branch of case 1, and the signed-in branch of case 2.

- [ ] **Step 8: Simplify `canProceed()` — remove auth case and renumber**

Replace the switch cases:
- case 0: Setup validation (was case 1 non-signed-in branch — check model/API key)
- case 1: Permissions check (was case 2 non-signed-in branch)
- case 2: Hotkey check (was case 3)

Remove the `isSignedIn || skipAuth` auth case and the `isSignedIn && !skipAuth` branches.

- [ ] **Step 9: Simplify navigation — remove `isSignedIn` conditionals in footer**

In the TitleBar section (~line 680), replace:
```typescript
actions={isSignedIn ? <SupportDropdown /> : undefined}
```
With:
```typescript
actions={<SupportDropdown />}
```

In the footer navigation, remove the back-button hiding logic:
```typescript
{!(currentStep === 1 && isSignedIn && !skipAuth) && (
```
Replace with simply rendering the back button (still disabled on step 0):
```typescript
{(
```

Remove the spacer div conditioned on `isSignedIn`:
```typescript
{currentStep === 1 && isSignedIn && !skipAuth && <div />}
```

- [ ] **Step 10: Always show progress bar**

Replace:
```typescript
const showProgress = currentStep > 0;
```
With:
```typescript
const showProgress = true;
```

And adjust the content area to remove the `currentStep === 0` special styling for the auth card:
```typescript
className={`flex-1 px-6 md:px-12 overflow-y-auto py-6`}
```
```typescript
className={`w-full max-w-3xl mx-auto`}
```

- [ ] **Step 11: Clean up unused imports**

Remove `UserCircle` from the lucide-react import. Remove `skipAuth` from the `useLocalStorage` dependency if used. Verify no references to `isSignedIn`, `skipAuth`, `pendingVerificationEmail`, `AuthenticationStep`, or `EmailVerificationStep` remain:

```bash
grep -n "isSignedIn\|skipAuth\|pendingVerification\|AuthenticationStep\|EmailVerificationStep\|useAuth" src/components/OnboardingFlow.tsx
```

Expected: no matches.

- [ ] **Step 12: Verify TypeScript compiles**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
```

Note: There will be errors from other files that still import deleted hooks — that's expected and will be fixed in subsequent tasks.

- [ ] **Step 13: Commit**

```bash
git add src/components/OnboardingFlow.tsx
git commit -m "refactor: remove auth step from onboarding, go straight to setup"
```

---

### Task 6: Simplify ControlPanel (Remove Cloud UI)

**Files:**
- Modify: `src/components/ControlPanel.tsx`

- [ ] **Step 1: Remove cloud-related imports**

Delete these import lines:
```typescript
import { useAuth } from "../hooks/useAuth";
import { useUsage } from "../hooks/useUsage";
import ReferralModal from "./ReferralModal";
```

- [ ] **Step 2: Remove cloud hook calls and state**

Delete:
```typescript
const { isSignedIn, isLoaded: authLoaded, user } = useAuth();
const usage = useUsage();
```

Delete state declarations for cloud UI:
```typescript
const [showReferrals, setShowReferrals] = ...
const [showUpgradePrompt, setShowUpgradePrompt] = ...
```

- [ ] **Step 3: Remove cloud-related JSX renders**

Search for and remove:
- Any `<UsageDisplay` render
- Any `<UpgradePrompt` render
- Any `<ReferralModal` render
- Any `usage?.isPastDue` conditional blocks
- Any `isSignedIn` conditional rendering blocks
- Cloud migration logic referencing `setCloudTranscriptionMode("opencohere")`

- [ ] **Step 4: Clean up any remaining references**

```bash
grep -n "isSignedIn\|useAuth\|useUsage\|UsageDisplay\|UpgradePrompt\|ReferralModal\|showReferrals\|showUpgradePrompt\|usage\?\." src/components/ControlPanel.tsx
```

Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add src/components/ControlPanel.tsx
git commit -m "refactor: remove cloud UI from ControlPanel (usage, upgrade, referrals)"
```

---

### Task 7: Simplify Settings Store

**Files:**
- Modify: `src/stores/settingsStore.ts`

- [ ] **Step 1: Remove `isSignedIn` from the `SettingsState` interface**

Delete this line from the interface:
```typescript
isSignedIn: boolean;
```

- [ ] **Step 2: Remove `isSignedIn` initialization and setter**

Search for `isSignedIn` in the store creation and remove:
- The `readBoolean("isSignedIn", false)` initialization
- Any `setIsSignedIn` setter

- [ ] **Step 3: Remove cloud-only mode values**

The `cloudTranscriptionMode` field should keep `"byok"` as its default but remove `"opencohere"` as a valid option. Find where `cloudTranscriptionMode` defaults to `"opencohere"` and change the default to `"byok"`.

Similarly for `cloudReasoningMode` — change default from `"opencohere"` to `"byok"` or the first non-cloud option.

Remove `cloudAgentMode` state if it only supported `"opencohere"`.

Remove `cloudBackupEnabled` state.

- [ ] **Step 4: Remove cloud selector functions**

Delete selectors like:
```typescript
selectIsCloudReasoningMode = (state) =>
  state.isSignedIn && state.cloudReasoningMode === "opencohere";
selectIsCloudAgentMode = (state) =>
  state.isSignedIn && state.cloudAgentMode === "opencohere";
```

- [ ] **Step 5: Verify no `isSignedIn` references remain**

```bash
grep -n "isSignedIn\|opencohere\|cloudBackupEnabled" src/stores/settingsStore.ts
```

Expected: no matches for `isSignedIn`. `opencohere` should only appear if there are unrelated string references. `cloudBackupEnabled` should be gone.

- [ ] **Step 6: Commit**

```bash
git add src/stores/settingsStore.ts
git commit -m "refactor: remove isSignedIn and cloud mode defaults from settings store"
```

---

### Task 8: Simplify SettingsPage

**Files:**
- Modify: `src/components/SettingsPage.tsx`

This is a large file (~2900 lines). Work by searching for specific patterns.

- [ ] **Step 1: Remove auth import and hook call**

Delete:
```typescript
import { useAuth } from "../hooks/useAuth";
```

Delete the hook call:
```typescript
const { isSignedIn, isLoaded, user } = useAuth();
```

- [ ] **Step 2: Remove cloud account sections**

Search for and remove:
- Sign-in / sign-out button renders
- Cloud account info display (user email, name)
- Subscription management UI (plan display, upgrade buttons, "Upgrade to Pro")
- Pricing section
- Any `isSignedIn` conditional blocks — evaluate each: if the block shows cloud UI, delete it; if it shows BYOK/local UI, keep the contents and remove the condition wrapper.

- [ ] **Step 3: Remove `isSignedIn` props passed to child components**

Search for `isSignedIn` being passed as a prop (e.g., to transcription settings). Remove the prop.

- [ ] **Step 4: Simplify cloud reasoning mode section**

Remove the OpenCohere cloud reasoning option from any dropdowns/selectors. Keep BYOK and local reasoning options.

- [ ] **Step 5: Verify cleanup**

```bash
grep -n "isSignedIn\|useAuth\|isLoaded.*auth\|Upgrade to Pro\|sign.in\|sign.out\|cloudBackupEnabled" src/components/SettingsPage.tsx
```

Expected: no matches (case-insensitive search may be needed for UI strings).

- [ ] **Step 6: Commit**

```bash
git add src/components/SettingsPage.tsx
git commit -m "refactor: remove cloud account, subscription, and auth UI from settings"
```

---

### Task 9: Simplify AgentOverlay and UploadAudioView

**Files:**
- Modify: `src/components/AgentOverlay.tsx`
- Modify: `src/components/notes/UploadAudioView.tsx` (note: may be in `notes/` subdirectory)

- [ ] **Step 1: Fix AgentOverlay — remove cloud agent gating**

Find this line:
```typescript
const isCloudAgent = settings.isSignedIn && settings.cloudAgentMode === "opencohere";
```

Replace with:
```typescript
const isCloudAgent = false;
```

Or, if `isCloudAgent` is only used to enable/disable a feature, simplify by removing the variable and the cloud agent code path entirely.

- [ ] **Step 2: Fix UploadAudioView — remove `isSignedIn` import and simplify**

Remove:
```typescript
import { useAuth } from "../../hooks/useAuth";  // or "../hooks/useAuth"
```

Remove:
```typescript
const { isSignedIn } = useAuth();
```

Find this line:
```typescript
const showModelPicker = !isSignedIn || cloudTranscriptionMode === "byok" || useLocalWhisper;
```

Replace with:
```typescript
const showModelPicker = true;
```

Find the cloud mode conditional:
```typescript
isSignedIn && cloudTranscriptionMode === "opencohere" && !useLocalWhisper;
```

Replace with `false` or remove the block that depends on it.

Remove any mode selector options for `"opencohere"` cloud mode. Keep BYOK and local options.

- [ ] **Step 3: Verify cleanup**

```bash
grep -rn "isSignedIn\|useAuth\|opencohere" src/components/AgentOverlay.tsx src/components/notes/UploadAudioView.tsx 2>/dev/null
grep -rn "isSignedIn\|useAuth\|opencohere" src/components/UploadAudioView.tsx 2>/dev/null
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgentOverlay.tsx
git add src/components/notes/UploadAudioView.tsx src/components/UploadAudioView.tsx 2>/dev/null
git commit -m "refactor: remove cloud agent and auth conditionals from AgentOverlay and UploadAudioView"
```

---

### Task 10: Clean Up main.js (Remove OAuth Protocol)

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Remove OAuth protocol registration**

Find and remove the `getOAuthProtocol()` function (~lines 105-117) and `registerOpenCohereProtocol()` function (~lines 128-137).

Remove the protocol registration call (~lines 139-142).

- [ ] **Step 2: Remove OAuth callback handling in single-instance lock**

In the `app.on('second-instance', ...)` handler, remove any code that parses OAuth callback URLs (looking for `opencohere://` protocol deep links).

- [ ] **Step 3: Remove auth cookie management**

Search for cookie-related code in main.js that manages auth session cookies (setting/clearing cookies for the Neon Auth URL). Remove it. Keep any cookies needed for general Electron operation.

- [ ] **Step 4: Verify the file parses correctly**

```bash
node -c main.js
```

Expected: no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add main.js
git commit -m "refactor: remove OAuth protocol registration and auth cookie management"
```

---

### Task 11: Remove Cloud Dependencies and Environment Variables

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Uninstall cloud npm dependencies**

```bash
npm uninstall @neondatabase/auth @neondatabase/neon-js @vercel/blob
```

- [ ] **Step 2: Clean up .env.example**

Remove these lines from `.env.example`:

```
# Neon Auth (optional - for account features)
# Get your auth URL from the Neon console after enabling Neon Auth
VITE_NEON_AUTH_URL=

# OpenCohere Cloud API (optional - for cloud transcription)
VITE_OPENCOHERE_API_URL=
```

Also rename `OPENCOHERE_LOG_LEVEL` to `OPENCOHERE_LOG_LEVEL` (or just `LOG_LEVEL`).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: remove cloud dependencies and env vars"
```

---

### Task 12: Remove `cloud_id` from Notes Schema

**Files:**
- Modify: whichever file defines the notes table schema (search for `cloud_id` in `src/`)

- [ ] **Step 1: Find and remove `cloud_id`**

```bash
grep -rn "cloud_id" src/
```

Remove the `cloud_id` column from the CREATE TABLE statement and any INSERT/SELECT/UPDATE queries that reference it.

- [ ] **Step 2: Commit**

```bash
git add -A src/
git commit -m "chore: remove cloud_id from notes schema"
```

---

### Task 13: Find and Fix All Remaining Cloud References

**Files:**
- Multiple — scan entire `src/` directory

- [ ] **Step 1: Search for all remaining references to deleted modules**

```bash
grep -rn "useAuth\|useUsage\|neonAuth\|AuthenticationStep\|EmailVerificationStep\|UsageDisplay\|UpgradePrompt\|ReferralDashboard\|ReferralModal\|ForgotPasswordView\|ResetPasswordView\|SpectrogramCard\|generateWaveform" src/
```

For each match: remove the import and any code that depends on it.

- [ ] **Step 2: Search for remaining cloud API references**

```bash
grep -rn "cloudTranscribe\|cloudReason\|cloudStreamingUsage\|cloudUsage\|cloudCheckout\|cloudBillingPortal\|cloudSwitchPlan\|cloudPreviewSwitch\|transcribeAudioFileCloud\|getReferralStats\|sendReferralInvite\|getReferralInvites\|authClearSession" src/
```

For each match: remove the call and simplify the surrounding code.

- [ ] **Step 3: Search for remaining `isSignedIn` references**

```bash
grep -rn "isSignedIn" src/
```

For each match: either remove the conditional (if it gates cloud-only code) or simplify it (if it gates BYOK UI that should now always show).

- [ ] **Step 4: Search for `opencohere` references in code (not docs/readme)**

```bash
grep -rn "opencohere\|OpenCohere" src/ main.js preload.js
```

These will be handled in the rebrand task, but flag any that are functional (not just strings).

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

Expected: clean compile (or only pre-existing unrelated errors).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: fix all remaining cloud/auth references across codebase"
```

---

### Task 14: Rebrand OpenCohere → OpenCohere

**Files:**
- Modify: `package.json`
- Modify: `electron-builder.json`
- Modify: `main.js`
- Modify: `README.md`
- Modify: `.github/` files
- Modify: any UI strings in `src/`

- [ ] **Step 1: Update package.json**

Change:
```json
"name": "open-cohere"
```
To:
```json
"name": "open-cohere"
```

Update the `description` field to reference OpenCohere instead of OpenCohere.

- [ ] **Step 2: Update electron-builder.json**

Change:
```json
"appId": "com.herotools.openwispr"
"productName": "OpenCohere"
```
To:
```json
"appId": "com.opencohere.app"
"productName": "OpenCohere"
```

Remove the `protocols` block (OAuth protocol — already non-functional after Task 10):
```json
"protocols": {
  "name": "OpenCohere Protocol",
  "schemes": ["opencohere"]
},
```

- [ ] **Step 3: Update UI-facing strings**

```bash
grep -rn "OpenCohere\|opencohere\|open-cohere\|open_whispr" src/ main.js preload.js --include="*.ts" --include="*.tsx" --include="*.js"
```

For each match, replace with the appropriate OpenCohere variant:
- `OpenCohere` → `OpenCohere`
- `opencohere` → `opencohere`
- `open-cohere` → `open-cohere`

Be careful with:
- localStorage keys: changing these would lose user settings. Decide whether to migrate or keep old keys.
- Log messages: safe to rename.
- Window titles: rename.

- [ ] **Step 4: Update .env.example**

Rename `OPENCOHERE_LOG_LEVEL` to `OPENCOHERE_LOG_LEVEL` (if not already done in Task 11).

- [ ] **Step 5: Update README.md**

Replace all references to OpenCohere with OpenCohere. Update the project description, remove sections about cloud features, subscriptions, and referrals. Keep sections about local transcription, BYOK, and all local features.

- [ ] **Step 6: Update .github/ files**

```bash
grep -rn "OpenCohere\|opencohere" .github/
```

Update issue templates, CI configs, and any other GitHub files.

- [ ] **Step 7: Flag resources needing new branding**

```bash
ls resources/
```

Note any icons, images, or assets that contain "OpenCohere" branding. These need new assets (out of scope for this plan — just document them).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "rebrand: OpenCohere → OpenCohere across codebase"
```

---

### Task 15: Final Verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit --pretty
```

Expected: clean compile.

- [ ] **Step 2: Search for any remaining cloud references**

```bash
grep -rn "neonAuth\|useAuth\|useUsage\|isSignedIn\|cloudTranscribe\|cloudReason\|VITE_NEON_AUTH\|VITE_OPENCOHERE" src/ main.js preload.js
```

Expected: no matches.

- [ ] **Step 3: Search for any remaining OpenCohere references (excluding docs/)**

```bash
grep -rn "OpenCohere\|opencohere\|open-cohere" src/ main.js preload.js electron-builder.json package.json .env.example
```

Expected: no matches.

- [ ] **Step 4: Verify the app starts**

```bash
npm run dev
```

Expected: app launches, onboarding shows Setup step first (not auth), BYOK settings accessible.

- [ ] **Step 5: Verify no deleted module is referenced**

```bash
grep -rn "from.*neonAuth\|from.*useAuth\|from.*useUsage\|from.*AuthenticationStep\|from.*EmailVerificationStep\|from.*UsageDisplay\|from.*UpgradePrompt\|from.*ReferralDashboard\|from.*ReferralModal\|from.*ForgotPasswordView\|from.*ResetPasswordView\|from.*SpectrogramCard" src/ main.js preload.js
```

Expected: no matches.

- [ ] **Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final cleanup after cloud removal and rebrand"
```
