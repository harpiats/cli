import { input } from "@inquirer/prompts";
import { actions } from "../actions";

import type { TemplateEngine } from "@harpiats/core";

const observer = async (engine: TemplateEngine) => {
  const name = await input({
    message: "Observer name (Use a model name)",
  });

  return actions.observer({ engine, name });
};

export { observer };
