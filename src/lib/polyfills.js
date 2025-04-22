import "./bridge";

import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;
