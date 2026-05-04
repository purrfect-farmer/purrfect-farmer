import axios from "axios";

export default class FloxyClient {
  constructor(apiKey) {
    this.client = axios.create({
      baseURL: "https://api.floxy.io",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  async getBalance() {
    const { data } = await this.client.get("/balance");
    return data.balance;
  }

  async getAllPlans() {
    const { data } = await this.client.get("/plans/all");
    return data;
  }

  async getPlan(planId) {
    const { data } = await this.client.get(`/plans/get/${planId}`);
    return data;
  }
}
