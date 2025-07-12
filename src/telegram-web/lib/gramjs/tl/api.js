import "@/lib/polyfills";

import { buildApiFromTlSchema } from "./apiHelpers.js";

const Api = buildApiFromTlSchema();

export default Api;
