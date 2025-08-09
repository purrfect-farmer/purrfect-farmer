import userAgents from "@purrfect/shared/resources/userAgents";

import useStorageState from "./useStorageState";

export default function useUserAgent() {
  return useStorageState("user-agent", userAgents[0], true).value;
}
