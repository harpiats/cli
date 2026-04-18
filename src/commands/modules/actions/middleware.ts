import fs from "node:fs";
import path from "node:path";

import { Utils, colorize } from "@harpia/common";
import type { TemplateEngine } from "@harpia/core";

export type Props = {
  engine: TemplateEngine;
  name: string;
};

export const middleware = async ({ engine, name }: Props) => {
  const fileName = `${Utils.string.kebabCase(name.toLowerCase())}.ts`;
  const filePath = path.join(process.cwd(), "app", "middlewares");

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }

  const content = await engine.render("middleware", { name });
  fs.writeFileSync(path.join(filePath, fileName), content);

  const colored = colorize("#FFA500", `app/middlewares/${fileName}`);
  console.log(`The file has been generated at ${colored}.`);
};
