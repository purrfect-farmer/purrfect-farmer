/** Body carrying the Telegram init data */
export const authSchema = {
  body: {
    type: "object",
    required: ["auth"],
    properties: {
      auth: { type: "string" },
    },
  },
};

/** Body naming one of the member's farmers */
export const farmerSchema = {
  body: {
    type: "object",
    required: ["auth", "id"],
    properties: {
      auth: { type: "string" },
      id: { type: "string" },
    },
  },
};
