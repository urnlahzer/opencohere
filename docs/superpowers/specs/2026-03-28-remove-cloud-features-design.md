# OpenCohere: Remove Cloud & Account Features

**Date:** 2026-03-28
**Approach:** Surgical Deletion (Approach A) with logical commit groups

## Goal

Remove all cloud/account features from the OpenWhispr fork and rebrand to OpenCohere. The app becomes a purely local-first tool with optional BYOK (Bring Your Own Key) cloud AI via user's own API keys.

## Scope

### Features Being Removed

1. **OpenWhispr Cloud Transcription** — cloud-managed STT with no user API keys
2. **Account System** — Google OAuth, email/password sign-in, email verification (Neon Auth)
3. **Subscription Management** — Free tier (2,000 words/week), Pro tier, 7-day trial, Stripe billing
4. **Referral Program** — referral codes, invite tracking, reward system
5. **Cloud Notes Sync** — Vercel Blob-backed note synchronization

### What Stays Untouched

- Local transcription (whisper.cpp, Parakeet models)
- BYOK API key inputs (OpenAI, Anthropic, Gemini, Groq, custom endpoints)
- Local AI reasoning via user's own keys or local LLMs
- Notes feature (local-only)
- Meeting transcription (local)
- Custom actions/templates
- Custom dictionary & auto-learning
- Hotkey system, activation modes
- Theme, UI preferences
- Local SQLite database (minus `cloud_id` field)

## Section 1: Files to Delete

### Components
- `src/components/AuthenticationStep.tsx`
- `src/components/EmailVerificationStep.tsx`
- `src/components/UsageDisplay.tsx`
- `src/components/UpgradePrompt.tsx`
- `src/components/ReferralDashboard.tsx`
- `src/components/ReferralModal.tsx`
- `src/components/ForgotPasswordView.tsx`
- `src/components/ResetPasswordView.tsx`
- `src/components/referral-cards/` (entire directory)

### Libraries & Hooks
- `src/lib/neonAuth.ts`
- `src/hooks/useAuth.ts`
- `src/hooks/useUsage.ts`

### npm Dependencies to Uninstall
- `@neondatabase/auth`
- `@neondatabase/neon-js`
- `@vercel/blob`

## Section 2: IPC Handlers to Remove

From `src/helpers/ipcHandlers.js`:
- `cloud-transcribe`
- `transcribe-audio-file-cloud`
- `cloud-streaming-usage`
- `auth-clear-session`
- `cloud-usage`
- `cloud-checkout`
- `cloud-billing-portal`
- `cloud-switch-plan`
- `cloud-preview-switch`
- `get-referral-stats`
- `send-referral-invite`
- `get-referral-invites`
- `cloud-reason`

From `preload.js`: Remove all corresponding API methods exposed to renderer.

## Section 3: Files to Modify

### `main.js`
- Remove OAuth protocol registration (`openwhispr://`)
- Remove OAuth callback handling
- Remove auth-related cookie management
- Keep: window creation, app lifecycle, local features

### `src/components/OnboardingFlow.tsx`
- Remove `AuthenticationStep` import and conditional step
- Go straight to setup/permissions steps
- Remove `isSignedIn` checks that adjust step count

### `src/components/ControlPanel.tsx`
- Remove `UsageDisplay`, `UpgradePrompt`, `ReferralModal` imports and renders
- Remove `isSignedIn` conditional rendering

### `src/stores/settingsStore.ts`
- Remove `isSignedIn` flag
- Remove cloud mode states: `cloudTranscriptionMode: "openwhispr"`, `cloudReasoningMode: "openwhispr"`, `cloudAgentMode: "openwhispr"`, `cloudBackupEnabled`
- Keep: BYOK and local settings, all API key fields, `cloudTranscriptionMode: "byok"` as default
- Keep: `byokDetection.ts` and all BYOK auto-detection logic

### `src/components/SettingsPage.tsx`
- Remove cloud account section, subscription management UI
- Remove sign-in/sign-out buttons
- Remove `isSignedIn` conditional blocks
- Keep: local model settings, BYOK API key inputs, all other preferences

### `preload.js`
- Remove cloud/auth/referral API methods
- Keep: local transcription, notes, BYOK methods

### `.env.example`
- Remove: `VITE_NEON_AUTH_URL`, `VITE_OPENWHISPR_API_URL`, `VITE_OPENWHISPR_OAUTH_CALLBACK_URL`, `VITE_OPENWHISPR_PROTOCOL`
- Keep: local config variables

### `src/components/AgentOverlay.tsx`
- Remove `isSignedIn && cloudAgentMode === "openwhispr"` gating

### `src/components/UploadAudioView.tsx`
- Simplify `!isSignedIn` conditionals — BYOK/local model picker should always show (no cloud mode exists)
- Keep: all BYOK transcription logic (`transcribeAudioFileByok` calls, `getActiveApiKey()`)

### `src/components/TranscriptionModelPicker.tsx`
- Keep entirely — renders BYOK key inputs
- May need minor cleanup if it references `isSignedIn`

### Notes Schema
- Remove `cloud_id` column from notes table

## BYOK Safety Note

BYOK uses entirely separate code paths from cloud features:
- **Transcription**: `transcribe-audio-file-byok` handler (NOT `cloud-transcribe`)
- **Reasoning**: `ReasoningService` with direct provider API calls (NOT `cloud-reason`)
- **Keys**: Stored in localStorage, fetched via `environmentManager`
- **Detection**: `byokDetection.ts` auto-detects stored keys

Removing cloud handlers, auth, and `isSignedIn` does NOT break BYOK. Conditionals using `!isSignedIn` to show BYOK UI must be simplified to always show BYOK UI.

## Section 4: Rebrand

Replace "OpenWhispr" → "OpenCohere" in:
- `package.json` — name, productName, description
- `electron-builder.json` — appId, productName, artifact names
- `main.js` — window titles
- UI strings — any user-facing "OpenWhispr" text
- `README.md` — title, descriptions, branding
- `.github/` — issue templates, CI config references
- Resources — flag icons/assets needing new branding (no asset generation in this phase)

## Commit Strategy

Logical commit groups for traceability:
1. Delete cloud-only files (components, hooks, libs)
2. Strip cloud IPC handlers and preload methods
3. Modify shared files (OnboardingFlow, ControlPanel, SettingsPage, settingsStore, AgentOverlay)
4. Remove cloud dependencies and env vars
5. Rebrand OpenWhispr → OpenCohere
6. Clean up: remove dead imports, unused types, lint

## Future Phases (Out of Scope)

1. **Cohere model swap** — Replace transcription models with Cohere
2. **SilverBullet notes sync** — Add optional sync to SilverBullet server
