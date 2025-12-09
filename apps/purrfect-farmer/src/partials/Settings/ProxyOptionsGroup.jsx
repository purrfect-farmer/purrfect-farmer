import LabelToggle from "@/components/LabelToggle";
import { memo } from "react";
import {
  SettingsGroup,
  SettingsInput,
  SettingsLabel,
} from "./SettingsComponents";

const PROXY_DISABLED = Boolean(import.meta.env.VITE_WHISKER);

export default memo(function ProxyOptionsGroup({
  sharedSettings,
  configureSharedSettings,
}) {
  return (
    <SettingsGroup id={"proxy"} title={"Proxy Options"}>
      {/* Enable Proxy */}
      <LabelToggle
        disabled={PROXY_DISABLED}
        onChange={(ev) =>
          configureSharedSettings("proxyEnabled", ev.target.checked)
        }
        checked={sharedSettings.proxyEnabled}
      >
        Enable Proxy
      </LabelToggle>

      <p className="text-neutral-500 dark:text-neutral-400">
        To enable this option, first turn off cloud proxy sharing.
      </p>

      {/* Proxy Host */}
      <SettingsLabel>Proxy Host</SettingsLabel>
      <SettingsInput
        placeholder="Proxy Host"
        disabled={PROXY_DISABLED}
        initialValue={sharedSettings?.proxyHost}
        onConfirm={(proxyHost) =>
          configureSharedSettings("proxyHost", proxyHost)
        }
      />

      {/* Proxy Port */}
      <SettingsLabel>Proxy Port</SettingsLabel>
      <SettingsInput
        placeholder="Proxy Port"
        disabled={PROXY_DISABLED}
        initialValue={sharedSettings?.proxyPort}
        onConfirm={(proxyPort) =>
          configureSharedSettings("proxyPort", proxyPort)
        }
      />

      {/* Proxy Username */}
      <SettingsLabel>Proxy Username</SettingsLabel>
      <SettingsInput
        placeholder="Proxy Username"
        disabled={PROXY_DISABLED}
        initialValue={sharedSettings?.proxyUsername}
        onConfirm={(proxyUsername) =>
          configureSharedSettings("proxyUsername", proxyUsername)
        }
      />

      {/* Proxy Password */}
      <SettingsLabel>Proxy Password</SettingsLabel>
      <SettingsInput
        placeholder="Proxy Password"
        disabled={PROXY_DISABLED}
        initialValue={sharedSettings?.proxyPassword}
        onConfirm={(proxyPassword) =>
          configureSharedSettings("proxyPassword", proxyPassword)
        }
      />

      {/* Share Cloud Proxy */}
      <SettingsLabel>Cloud Proxy</SettingsLabel>
      <LabelToggle
        onChange={(ev) =>
          configureSharedSettings("shareCloudProxy", ev.target.checked)
        }
        checked={sharedSettings.shareCloudProxy}
      >
        Share Cloud Proxy
      </LabelToggle>
    </SettingsGroup>
  );
});
