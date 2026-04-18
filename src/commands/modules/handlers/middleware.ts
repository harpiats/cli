import { input } from "@inquirer/prompts";
import { actions } from "../actions";

import type { TemplateEngine } from "@harpia/core";

const middleware = async (engine: TemplateEngine) => {
  const name = await input({ message: "Middleware name" });

  return actions.middleware({ engine, name });
};

export { middleware };
