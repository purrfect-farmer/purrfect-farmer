import { memo } from "react";
import {
  SettingsGroup,
  SettingsInput,
  SettingsLabel,
} from "./SettingsComponents";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import Select from "@/components/Select";
import LabelToggle from "@/components/LabelToggle";

export default memo(function CaptchaOptionsGroup({
  sharedSettings,
  dispatchAndConfigureSharedSettings,
}) {
  return (
    <SettingsGroup
      id={"captcha"}
      title={"Captcha Options"}
      icon={<HiOutlineShieldCheck className="size-5" />}
    >
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings(
            "captchaEnabled",
            ev.target.checked
          )
        }
        checked={sharedSettings?.captchaEnabled}
      >
        Enable Captcha Solver
      </LabelToggle>

      <SettingsLabel>Captcha Provider</SettingsLabel>
      <Select
        value={sharedSettings?.captchaProvider}
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings("captchaProvider", ev.target.value)
        }
      >
        <Select.Item value="2captcha">2Captcha</Select.Item>
        <Select.Item value="captchaai">CaptchaAI</Select.Item>
        <Select.Item value="solvecaptcha">SolveCaptcha</Select.Item>
        <Select.Item value="captchasonic">CaptchaSonic</Select.Item>
        <Select.Item value="nocaptchaai">NoCaptchaAI</Select.Item>
      </Select>

      {/* Captcha API Key */}
      <SettingsLabel>Captcha API Key</SettingsLabel>
      <SettingsInput
        placeholder="Captcha API Key"
        initialValue={sharedSettings?.captchaApiKey}
        onConfirm={(captchaApiKey) =>
          dispatchAndConfigureSharedSettings("captchaApiKey", captchaApiKey)
        }
      />
    </SettingsGroup>
  );
});
