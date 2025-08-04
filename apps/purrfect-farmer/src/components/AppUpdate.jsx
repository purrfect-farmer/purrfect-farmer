import axios from "axios";
import semver from "semver";
import useStaticQuery from "@/hooks/useStaticQuery";
import { memo } from "react";

import PrimaryButton from "./PrimaryButton";

export default memo(function AppUpdate() {
  const currentVersion = `v${__APP_PACKAGE_VERSION__}`;
  const { data } = useStaticQuery({
    enabled: !import.meta.env.VITE_WHISKER,
    queryKey: ["app", "release", "latest"],
    queryFn: ({ signal }) =>
      axios
        .get(import.meta.env.VITE_APP_RELEASE_API_URL, { signal })
        .then((res) => res.data),
  });

  const latestVersion = data?.["tag_name"];
  const show = latestVersion && semver.gt(latestVersion, currentVersion);

  return show ? (
    <PrimaryButton
      as={"a"}
      href={import.meta.env.VITE_APP_RELEASE_PAGE_URL}
      target="_blank"
      className="bg-orange-500 rounded-none text-center"
    >
      🎉 Update to Latest Version - {latestVersion}
    </PrimaryButton>
  ) : null;
});
