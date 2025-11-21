import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import { memo } from "react";
import { SettingsGroup, SettingsLabel } from "./SettingsComponents";

export default memo(function ProxyOptionsGroup({
  sharedSettings,
  configureSharedSettings,
}) {
  return (
    <SettingsGroup id={"proxy"} title={"Proxy Options"}>
      {/* Enable Proxy */}
      <LabelToggle
        disabled={Boolean(import.meta.env.VITE_WHISKER)}
        onChange={(ev) =>
          configureSharedSettings("proxyEnabled", ev.target.checked)
        }
        checked={sharedSettings.proxyEnabled}
      >
        Enable Proxy
      </LabelToggle>

      <p className="text-neutral-500 dark:text-neutral-400">
        To enable this option, first turn off proxy sharing in Cloud options.
      </p>

      {/* Proxy Host */}
      <SettingsLabel>Proxy Host</SettingsLabel>
      <Input
        disabled={Boolean(import.meta.env.VITE_WHISKER)}
        value={sharedSettings.proxyHost}
        onChange={(ev) => configureSharedSettings("proxyHost", ev.target.value)}
        placeholder="Proxy Host"
      />

      {/* Proxy Port */}
      <SettingsLabel>Proxy Port</SettingsLabel>
      <Input
        disabled={Boolean(import.meta.env.VITE_WHISKER)}
        value={sharedSettings.proxyPort}
        onChange={(ev) => configureSharedSettings("proxyPort", ev.target.value)}
        placeholder="Proxy Port"
      />

      {/* Proxy Username */}
      <SettingsLabel>Proxy Username</SettingsLabel>
      <Input
        disabled={Boolean(import.meta.env.VITE_WHISKER)}
        value={sharedSettings.proxyUsername}
        onChange={(ev) =>
          configureSharedSettings("proxyUsername", ev.target.value)
        }
        placeholder="Proxy Username"
      />

      {/* Proxy Password */}
      <SettingsLabel>Proxy Password</SettingsLabel>
      <Input
        disabled={Boolean(import.meta.env.VITE_WHISKER)}
        value={sharedSettings.proxyPassword}
        onChange={(ev) =>
          configureSharedSettings("proxyPassword", ev.target.value)
        }
        placeholder="Proxy Password"
      />
    </SettingsGroup>
  );
});
