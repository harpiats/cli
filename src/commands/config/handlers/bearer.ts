import { input, select } from "@inquirer/prompts";
import { actions } from "../actions";

import type { TemplateEngine } from "@harpia/core";

const bearer = async (engine: TemplateEngine) => {
  const model = await input({
    message: "Which model contains the login information? (e.g., User)",
    default: "User",
  });

  const identifierField = await input({
    message: "Which field will be used for login? (e.g., email, username, document)",
    default: "email",
  });

  const storage = await select<"database" | "redis">({
    message: "Where do you want to store tokens?",
    choices: [
      { name: "Database (Prisma)", value: "database" },
      { name: "Redis", value: "redis" },
    ],
  });

  return actions.bearer({ engine, model, identifierField, storage });
};

export { bearer };