import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

export const swaggerPlugin = fp(async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Multi-Tenant Task Management API",
        version: "1.0.0"
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    }
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs"
  });
});
