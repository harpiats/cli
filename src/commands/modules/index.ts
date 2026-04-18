import { handlers } from "./handlers";
import { getOption } from "./options";
import { engine } from "./setup";
import { handlers as configHandlers } from "../config/handlers";
import { getOption as getConfigOption } from "../config/options";

import { engine as configEngine } from "../config/setup";

export const Generator = async () => {
  const cliOption = process.argv[2];
  const option = await getOption(cliOption);

  if (!option) {
    return console.warn("You need to select an option to generate.");
  }

  if (option === "setup") {
    const configOption = await getConfigOption();

    if (!configOption) {
      return console.warn("You need to select a valid option.");
    }

    const configGenerators = {
      session: configHandlers.session,
      bearer: configHandlers.bearer,
    };

    if (!Object.keys(configGenerators).includes(configOption)) {
      return console.error("Invalid option.");
    }

    await configGenerators[configOption as keyof typeof configGenerators](configEngine);
    return;
  }

  const generators = {
    factory: handlers.factory,
    middleware: handlers.middleware,
    module: handlers.module,
    task: handlers.task,
    test: handlers.test,
    validation: handlers.validation,
    observer: handlers.observer,
    controller: handlers.controller,
    seed: handlers.seed,
  };

  if (!Object.keys(generators).includes(option)) {
    return console.error("Invalid option.");
  }

  await generators[option as keyof typeof generators](engine);
};

try {
  await Generator();
} catch (error: any) {
  if (error.name === "ExitPromptError") {
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
}
