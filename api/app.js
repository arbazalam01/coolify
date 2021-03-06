module.exports = async function (fastify, opts) {
  // Private routes
  fastify.register(async function (server) {
    server.register(require("./plugins/authentication"));
    server.register(require("./v1/dashboard"), { prefix: "/dashboard" });
    server.register(require("./v1/config"), { prefix: "/config" });
    server.register(require("./v1/secret"), { prefix: "/secret" });
    server.register(require("./v1/logs"), { prefix: "/logs" });
  });
  // Public routes
  fastify.register(require("./v1/verify"), { prefix: "/verify" });
  fastify.register(require("./v1/login/github"), {
    prefix: "/login/github",
  });
  fastify.register(require("./v1/webhooks/deploy"), {
    prefix: "/webhooks/deploy",
  });
  fastify.register(require("./v1/undead"), {
    prefix: "/undead",
  });
};
