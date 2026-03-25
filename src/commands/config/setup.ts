import path from "node:path";

import { Utils } from "@harpia/common";
import { TemplateEngine } from "@harpia/core";

const templatesPath = path.join(__dirname, "templates");
const engine = new TemplateEngine({
  fileExtension: ".txt",
  path: {
    views: templatesPath,
    layouts: templatesPath,
    components: templatesPath,
  },
});

engine.registerPlugin("pluralize", Utils.string.pluralize);
engine.registerPlugin("singularize", Utils.string.singularize);
engine.registerPlugin("pascalCase", Utils.string.pascalCase);

export { engine };
