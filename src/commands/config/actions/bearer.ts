import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import { colorize } from "@harpia/common";
import type { TemplateEngine } from "@harpia/core";

export type Props = {
  engine: TemplateEngine;
  model: string;
  identifierField: string;
  storage: "database" | "redis";
};

export const bearer = async ({ engine, model, identifierField, storage }: Props) => {
  const filePath = path.join(process.cwd(), "modules", "auth");
  const prismaPath = path.join(process.cwd(), "prisma", "schema.prisma");

  let defaultIdType = "String";
  let schemaStr = "";

  if (fs.existsSync(prismaPath)) {
    schemaStr = fs.readFileSync(prismaPath, "utf-8");
    const modelRegex = new RegExp(`model\\s+${model}\\s+\\{([\\s\\S]*?)\\}`, "g");
    const modelMatch = modelRegex.exec(schemaStr);

    if (modelMatch && modelMatch[1]) {
      const idRegex = /(\w+)\s+(\w+)\s+@id/;
      const idMatch = idRegex.exec(modelMatch[1]);
      if (idMatch && idMatch[2]) {
        defaultIdType = idMatch[2];
      }
    }
  }

  const lowerModel = model.toLowerCase();
  const idType = defaultIdType === "Int" ? "number" : "string";
  const payloadIdParser = defaultIdType === "Int" ? "Number(payload.id)" : "String(payload.id)";

  const templates = {
    configAuth: engine.render("auth/bearer/config/auth", { storage }),
    configJwtRedis: engine.render("auth/bearer/config/jwt-redis", { storage, lowerModel, idType, payloadIdParser }),
    configJwtDatabase: engine.render("auth/bearer/config/jwt-database", { storage, lowerModel, idType, payloadIdParser }),
    middleware: engine.render("auth/bearer/middlewares/auth"),
    route: engine.render("auth/bearer/module/bearer.routes"),
    controllers: {
      index: engine.render("auth/bearer/module/controllers/index"),
      store: engine.render("auth/bearer/module/controllers/store"),
      show: engine.render("auth/bearer/module/controllers/show"),
      destroy: engine.render("auth/bearer/module/controllers/destroy"),
    },
    services: {
      index: engine.render("auth/bearer/module/services/index"),
      create: engine.render("auth/bearer/module/services/create"),
    },
    validations: {
      index: engine.render("auth/bearer/module/validations/index"),
      create: engine.render("auth/bearer/module/validations/create", { identifierField }),
      validate: engine.render("auth/bearer/module/validations/validate-user", { model, identifierField }),
      checkPassword: engine.render("auth/bearer/module/validations/check-password"),
    },
  };

  const outputs = {
    configAuth: path.join(process.cwd(), "app/config", "auth.ts"), // NOVO
    configJwt: path.join(process.cwd(), "app/config", "jwt.ts"),
    middleware: path.join(process.cwd(), "app/middlewares", "auth.ts"),
    module: {
      route: path.join(filePath, "auth.routes.ts"),
      controllers: {
        index: path.join(filePath, "controllers", "index.ts"),
        store: path.join(filePath, "controllers", "store.ts"),
        show: path.join(filePath, "controllers", "show.ts"),
        destroy: path.join(filePath, "controllers", "destroy.ts"),
      },
      services: {
        index: path.join(filePath, "services", "index.ts"),
        create: path.join(filePath, "services", "create.ts"),
      },
      validations: {
        index: path.join(filePath, "validations", "index.ts"),
        create: path.join(filePath, "validations", "create.ts"),
        validate: path.join(filePath, "validations", "validate-user.ts"),
        checkPassword: path.join(filePath, "validations", "check-password.ts"),
      },
    },
  };

  // Create Directory
  fs.mkdirSync(path.join(process.cwd(), "modules/auth"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), "modules/auth", "controllers"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), "modules/auth", "services"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), "modules/auth", "validations"), { recursive: true });

  // Create files
  fs.writeFileSync(outputs.configAuth, await templates.configAuth);
  fs.writeFileSync(outputs.configJwt, storage === "redis" ? await templates.configJwtRedis : await templates.configJwtDatabase);
  fs.writeFileSync(outputs.middleware, await templates.middleware);
  fs.writeFileSync(outputs.module.route, await templates.route);

  fs.writeFileSync(outputs.module.controllers.index, await templates.controllers.index);
  fs.writeFileSync(outputs.module.controllers.store, await templates.controllers.store);
  fs.writeFileSync(outputs.module.controllers.show, await templates.controllers.show);
  fs.writeFileSync(outputs.module.controllers.destroy, await templates.controllers.destroy);

  fs.writeFileSync(outputs.module.services.index, await templates.services.index);
  fs.writeFileSync(outputs.module.services.create, await templates.services.create);

  fs.writeFileSync(outputs.module.validations.index, await templates.validations.index);
  fs.writeFileSync(outputs.module.validations.create, await templates.validations.create);
  fs.writeFileSync(outputs.module.validations.validate, await templates.validations.validate);
  fs.writeFileSync(outputs.module.validations.checkPassword, await templates.validations.checkPassword);

  if (storage === "database") {
    const prismaPath = path.join(process.cwd(), "prisma", "schema.prisma");

    if (fs.existsSync(prismaPath)) {
      let schema = fs.readFileSync(prismaPath, "utf-8");

      if (!schema.includes("model Token {")) {
        // Finds the target Model (e.g. User) and its ID type
        const modelRegex = new RegExp(`model\\s+${model}\\s+\\{([\\s\\S]*?)\\}`, "g");
        const modelMatch = modelRegex.exec(schema);
        let idType = "String";

        if (modelMatch && modelMatch[0] && modelMatch[1]) {
          const fullModelStr = modelMatch[0];
          const modelBody = modelMatch[1];

          // Extract ID type
          const idRegex = /(\w+)\s+(\w+)\s+@id/;
          const idMatch = idRegex.exec(modelBody);
          if (idMatch && idMatch[2]) {
            idType = idMatch[2];
          }

          // Injects the Token[] tokens relation into the existing Model, if there is none
          if (!modelBody.includes("tokens Token[]")) {
            const replacement = fullModelStr.replace(/}\s*$/, "  tokens Token[]\n}\n");
            schema = schema.replace(fullModelStr, replacement);
          }
        }

        const lowerModel = model.toLowerCase();
        const tokenModelStr = await engine.render("auth/bearer/prisma-token-model", {
          model,
          lowerModel,
          idType
        });

        schema += `\n${tokenModelStr}\n`;
        fs.writeFileSync(prismaPath, schema);
        console.log(colorize("#00c3ffff", `Token model injected into schema.prisma.`));

        try {
          console.log("Formatting schema.prisma...");
          execSync("bunx prisma format", { stdio: "inherit", cwd: process.cwd() });
        } catch (err) {
          console.error(colorize("#FF0000", "Failed to format schema.prisma."));
        }

        console.log(colorize("#00c3ffff", `Don't forget to run 'bun migrate'!`));
      }
    }
  } else {
    console.log(colorize("#00c3ffff", `Please ensure Redis is configured in your .env file.`));
  }

  // Generated message
  const moduleStr = colorize("#FFA500", "modules/auth");
  const configAuth = colorize("#FFA500", "app/config/auth.ts");
  const configJwt = colorize("#FFA500", "app/config/jwt.ts");
  const middleware = colorize("#FFA500", "app/middlewares/auth.ts");
  const message = `The files have been generated at ${moduleStr}, ${configAuth}, ${configJwt} and ${middleware}.`;

  console.log(message);

  console.log("Installing jsonwebtoken dependencies via bun...");
  try {
    execSync("bun add jsonwebtoken", { stdio: "inherit", cwd: process.cwd() });
    execSync("bun add -d @types/jsonwebtoken", { stdio: "inherit", cwd: process.cwd() });
    console.log("Dependencies installed successfully.");
  } catch (err) {
    console.error("Failed to install jsonwebtoken. Please install it manually: bun add jsonwebtoken && bun add -d @types/jsonwebtoken");
  }
};