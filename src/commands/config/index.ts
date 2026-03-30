import { handlers } from "./handlers";
import { getOption } from "./options";
import { engine } from "./setup";

export const Generator = async () => {
  const cliOption = process.argv[2];
  const option = await getOption(cliOption);

  const generators = {
    session: handlers.session,
    bearer: handlers.bearer,
  };

  if (!option) {
    return console.warn("You need to select a valid option.");
  }

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
