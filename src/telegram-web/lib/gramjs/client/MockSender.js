export default class MockSender {
    mockClient;
    constructor(mockClient) {
        this.mockClient = mockClient;
    }
    send(request) {
        return this.mockClient.invoke(request);
    }
    isConnected() {
        return true;
    }
}
