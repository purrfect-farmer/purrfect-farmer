import { inflate } from "pako/dist/pako_inflate";

import { createWorkerInterface } from "../../util/createPostMessageInterface";

globalThis.inflate = inflate;
globalThis.createWorkerInterface = createWorkerInterface;
