import { input } from "@inquirer/prompts";
import { actions } from "../actions";

import type { TemplateEngine } from "@harpia/core";

const task = async (engine: TemplateEngine) => {
  const name = await input({
    message: "Task name",
  });

  return actions.task({ engine, name });
};

export { task };
