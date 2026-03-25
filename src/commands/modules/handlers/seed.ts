import { input } from "@inquirer/prompts";
import type { TemplateEngine } from "@harpia/core";
import { actions } from "../actions";

const seed = async (engine: TemplateEngine) => {
  const name = await input({
    message: "Seed name (Use a model name)",
  });

  return actions.seed({ engine, name });
};

export { seed };
