import Pbf from "pbf";
import { useMutation } from "@tanstack/react-query";

import { getSession, writeCreateSession } from "../lib/utils";

export default function useUnijumpCreateSessionMutation() {
  return useMutation({
    mutationKey: ["unijump", "create-session"],
    mutationFn: async () => {
      const pbf = new Pbf();
      writeCreateSession(pbf, {
        ["mapgen_ver"]: "9",
        ["config_ver"]: "20",
        ["used_boosters"]: [],
      });

      const response = await fetch(
        "https://unijump.xyz/api/v1/gameplay/session/octet/create",
        {
          method: "POST",
          credentials: "include",
          body: pbf.finish(),
          headers: {
            "Content-Type": "application/octet-stream",
          },
        }
      );

      const buffer = new Uint8Array(await response.arrayBuffer());
      const session = getSession(buffer);

      return session;
    },
  });
}
