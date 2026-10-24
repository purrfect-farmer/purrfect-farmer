import { getPublicIp, reportToSeeker } from "../server-address.js";

import { check } from "./check.js";

/** Report this server to the Seeker server */
export default async function testSeeker(values, results) {
  await check(results, "Seeker server", async () => {
    if (!values.SEEKER_SERVER) throw new Error("Server URL is empty.");
    if (!values.APP_NAME) throw new Error("Server name is empty.");

    const address = await getPublicIp();

    await reportToSeeker(
      values.SEEKER_SERVER.replace(/\/+$/, ""),
      { key: values.SEEKER_KEY, name: values.APP_NAME, address },
      { timeout: 10_000 },
    );

    return `Reported ${address}`;
  });
}
