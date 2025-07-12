import { inflate } from 'pako/dist/pako_inflate';
import { serializeBytes } from '..';
export default class GZIPPacked {
    static CONSTRUCTOR_ID = 0x3072cfa1;
    static classType = 'constructor';
    data;
    CONSTRUCTOR_ID;
    classType;
    constructor(data) {
        this.data = data;
        this.CONSTRUCTOR_ID = 0x3072cfa1;
        this.classType = 'constructor';
    }
    static async gzipIfSmaller(contentRelated, data) {
        if (contentRelated && data.length > 512) {
            const gzipped = await new GZIPPacked(data).toBytes();
            if (gzipped.length < data.length) {
                return gzipped;
            }
        }
        return data;
    }
    static gzip(input) {
        return Buffer.from(input);
        // TODO this usually makes it faster for large requests
        // return Buffer.from(deflate(input, { level: 9, gzip: true }))
    }
    static ungzip(input) {
        return Buffer.from(inflate(input));
    }
    async toBytes() {
        const g = Buffer.alloc(4);
        g.writeUInt32LE(GZIPPacked.CONSTRUCTOR_ID, 0);
        return Buffer.concat([
            g,
            serializeBytes(await GZIPPacked.gzip(this.data)),
        ]);
    }
    static read(reader) {
        const constructor = reader.readInt(false);
        if (constructor !== GZIPPacked.CONSTRUCTOR_ID) {
            throw new Error('not equal');
        }
        return GZIPPacked.gzip(reader.tgReadBytes());
    }
    static async fromReader(reader) {
        const data = reader.tgReadBytes();
        return new GZIPPacked(await GZIPPacked.ungzip(data));
    }
}
