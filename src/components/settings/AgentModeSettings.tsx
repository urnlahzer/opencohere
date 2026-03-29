import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settingsStore";
import { HotkeyInput } from "../ui/HotkeyInput";
import { Toggle } from "../ui/toggle";
import { SettingsRow, SettingsPanel, SettingsPanelRow, SectionHeader } from "../ui/SettingsSection";
import ReasoningModelSelector from "../ReasoningModelSelector";
import { validateHotkeyForSlot } from "../../utils/hotkeyValidation";

export default function AgentModeSettings() {
  const { t } = useTranslation();
  const {
    agentEnabled,
    setAgentEnabled,
    agentKey,
    setAgentKey,
    dictationKey,
    meetingKey,
    agentModel,
    setAgentModel,
    agentProvider,
    setAgentProvider,
    agentSystemPrompt,
    setAgentSystemPrompt,
    openaiApiKey,
    setOpenaiApiKey,
    anthropicApiKey,
    setAnthropicApiKey,
    geminiApiKey,
    setGeminiApiKey,
    groqApiKey,
    setGroqApiKey,
    customReasoningApiKey,
    setCustomReasoningApiKey,
    cloudReasoningBaseUrl,
    setCloudReasoningBaseUrl,
  } = useSettingsStore();

  const validateAgentHotkey = useCallback(
    (hotkey: string) =>
      validateHotkeyForSlot(
        hotkey,
        {
          "settingsPage.general.hotkey.title": dictationKey,
          "settingsPage.general.meetingHotkey.title": meetingKey,
        },
        t
      ),
    [dictationKey, meetingKey, t]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("agentMode.settings.title")}
        description={t("agentMode.settings.description")}
      />

      {/* Enable/Disable */}
      <SettingsPanel>
        <SettingsPanelRow>
          <SettingsRow
            label={t("agentMode.settings.enabled")}
            description={t("agentMode.settings.enabledDescription")}
          >
            <Toggle checked={agentEnabled} onChange={setAgentEnabled} />
          </SettingsRow>
        </SettingsPanelRow>
      </SettingsPanel>

      {agentEnabled && (
        <>
          {/* Agent Hotkey */}
          <div>
            <SectionHeader
              title={t("agentMode.settings.hotkey")}
              description={t("agentMode.settings.hotkeyDescription")}
            />
            <HotkeyInput value={agentKey} onChange={setAgentKey} validate={validateAgentHotkey} />
          </div>

          {/* Model selector */}
          {(
            <div>
              <SectionHeader
                title={t("agentMode.settings.model")}
                description={t("agentMode.settings.modelDescription")}
              />
              <ReasoningModelSelector
                reasoningModel={agentModel}
                setReasoningModel={setAgentModel}
                localReasoningProvider={agentProvider}
                setLocalReasoningProvider={setAgentProvider}
                cloudReasoningBaseUrl={cloudReasoningBaseUrl}
                setCloudReasoningBaseUrl={setCloudReasoningBaseUrl}
                openaiApiKey={openaiApiKey}
                setOpenaiApiKey={setOpenaiApiKey}
                anthropicApiKey={anthropicApiKey}
                setAnthropicApiKey={setAnthropicApiKey}
                geminiApiKey={geminiApiKey}
                setGeminiApiKey={setGeminiApiKey}
                groqApiKey={groqApiKey}
                setGroqApiKey={setGroqApiKey}
                customReasoningApiKey={customReasoningApiKey}
                setCustomReasoningApiKey={setCustomReasoningApiKey}
              />
            </div>
          )}

          {/* Custom System Prompt */}
          <div>
            <SectionHeader
              title={t("agentMode.settings.systemPrompt")}
              description={t("agentMode.settings.systemPromptDescription")}
            />
            <SettingsPanel>
              <SettingsPanelRow>
                <textarea
                  value={agentSystemPrompt}
                  onChange={(e) => setAgentSystemPrompt(e.target.value)}
                  placeholder={t("agentMode.settings.systemPromptPlaceholder")}
                  rows={4}
                  className="w-full text-xs bg-transparent border border-border/50 rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/30 placeholder:text-muted-foreground/50"
                />
              </SettingsPanelRow>
            </SettingsPanel>
          </div>
        </>
      )}
    </div>
  );
}
