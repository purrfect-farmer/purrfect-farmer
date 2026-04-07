import EncrypterWorker from "../workers/EncrypterWorker?worker";
import { wrap } from "comlink";

const worker = new EncrypterWorker();
const encryption = wrap(worker);

export { encryption };
