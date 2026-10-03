/** Body with a required farmer id */
export const farmerSchema = {
  body: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

/** Body with an optional farmer id */
export const optionalFarmerSchema = {
  body: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
  },
};
