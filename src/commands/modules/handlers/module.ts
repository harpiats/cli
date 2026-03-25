import { input } from "@inquirer/prompts";
import { actions } from "../actions";

import type { TemplateEngine } from "@harpia/core";

const module = async (engine: TemplateEngine) => {
  const name = await input({
    message: "Module name",
  });

  return actions.module({ engine, name });
};

export { module };
