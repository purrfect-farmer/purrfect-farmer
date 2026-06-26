import axios from "axios";

export default class FloxyClient {
  constructor({ apiKey }) {
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

  /* Get Plan */
  async getPlan(planId) {
    const { data } = await this.client.get(`/plans/get/${planId}`);
    return data;
  }

  /* Get proxies */
  async getProxies(selectedPlanId = null) {
    let planId = selectedPlanId;
    if (!planId) {
      const list = await this.getAllPlans();
      const plan = list.find(
        (item) => item.type === "DEDICATED_DATACENTER",
      );

      if (plan) {
        planId = plan.id;
      }
    }

    /** Return an empty list if not plan ID is configured */
    if (!planId) {
      return [];
    }

    const details = await this.getPlan(planId);
    const { authorization } = details;
    const { username, password } = authorization;

    /** Flat map the IPs */
    const ips = details["ip_list"].flatMap((item) =>
      item.cities.flatMap((city) => city.ips),
    );

    return ips.map((ip) => `${username}:${password}@${ip}:1338`);
  }
}
