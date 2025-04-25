import Pbf from "pbf";
import { useMutation } from "@tanstack/react-query";

import { writeSessionUpdate } from "../lib/utils";

export default function useUnijumpUpdateSessionMutation() {
  return useMutation({
    mutationKey: ["unijump", "update-session"],
    mutationFn: async ({ id, chunks, score }) => {
      const pbf = new Pbf();
      writeSessionUpdate(pbd, {
        id,
        chunks,
        score,
      });

      const response = await fetch(
        "https://unijump.xyz/api/v1/gameplay/session/octet/update",
        {
          method: "POST",
          body: pbf.finish(),
          headers: {
            "Content-Type": "application/octet-stream",
          },
        }
      );

      const result = await response.json();

      return result;
    },
  });
}
