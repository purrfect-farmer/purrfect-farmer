import * as bcrypt from "bcryptjs";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Login */
  fastify.post(
    "/login",
    {
      /** Reachable without a token */
      config: { public: true },
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    async function (request, reply) {
      const user = await fastify.db.User.findOne({
        attributes: { include: ["password"] },
        where: {
          [fastify.db.Sequelize.Op.or]: {
            username: request.body.email,
            email: request.body.email,
          },
        },
      });

      if (!user) {
        return reply.badRequest("These credentials do not match any record!");
      }

      /** Compare Password */
      const valid = await bcrypt.compare(request.body.password, user.password);

      if (!valid) {
        return reply.badRequest("Incorrect Password!");
      }

      /** JWT Token */
      const token = fastify.jwt.sign({ id: user.id });

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          emailVerifiedAt: user.emailVerifiedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      });
    },
  );

  /** Get User */
  fastify.get("/user", async (request) => {
    const user = await fastify.db.User.findByPk(request.user.id);
    return user;
  });

  /** Update Password */
  fastify.post(
    "/update-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string" },
          },
        },
      },
    },
    async function (request, reply) {
      const user = await fastify.db.User.findByPk(request.user.id);

      /** Compare Password */
      const valid = await bcrypt.compare(
        request.body.currentPassword,
        user.password,
      );

      if (valid) {
        await user.update({
          password: await bcrypt.hash(request.body.newPassword, 10),
        });
      } else {
        return reply.badRequest("Incorrect Password!");
      }
    },
  );
}
