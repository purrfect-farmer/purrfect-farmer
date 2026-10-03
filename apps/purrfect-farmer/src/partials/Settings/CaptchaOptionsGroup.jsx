import { memo } from "react";
import {
  SettingsGroup,
  SettingsInput,
  SettingsLabel,
} from "./SettingsComponents";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import Select from "@/components/Select";
import LabelToggle from "@/components/LabelToggle";
import { CAPTCHA_PROVIDERS } from "@purrfect/shared/lib/captcha/providers";

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
        {CAPTCHA_PROVIDERS.map((provider) => (
          <Select.Item key={provider.id} value={provider.id}>
            {provider.title}
          </Select.Item>
        ))}
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
