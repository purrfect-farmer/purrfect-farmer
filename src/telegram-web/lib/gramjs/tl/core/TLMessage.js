export default class TLMessage {
    static SIZE_OVERHEAD = 12;
    static classType = 'constructor';
    msgId;
    seqNo;
    obj;
    constructor(msgId, seqNo, obj) {
        this.msgId = msgId;
        this.seqNo = seqNo;
        this.obj = obj;
    }
}
