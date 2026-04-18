#!/usr/bin/env bun
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Bun from "bun";
import { colorize } from "@harpia/common";

type Mode = "api" | "fullstack";

const npmBinPath = path.join(process.cwd(), "node_modules", ".bin");

const execCommand = (command: string): void => {
  try {
    execSync(command, {
      stdio: "inherit",
      env: { ...process.env, PATH: `${npmBinPath}:${process.env.PATH}` },
    });
  } catch (_) {
    console.log("\n");
    console.log("Process Interrupted");

    process.exit(0);
  }
};

const checkDependency = async (str: string): Promise<boolean> => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = Bun.file(packageJsonPath);

  if (!packageJson.size) {
    console.log("package.json not found");
    process.exit(0);
  }

  const packageJsonContent = await packageJson.json();

  return packageJsonContent.dependencies[str];
};

const testSequential = (targetPath = "modules") => {
  const findTestFiles = (dir: string): string[] => {
    let files: string[] = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files = files.concat(findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".spec.ts")) {
        files.push(fullPath);
      }
    }

    return files;
  };

  const fullTargetPath = path.join(process.cwd(), targetPath);

  if (!fs.existsSync(fullTargetPath)) {
    process.exit(1);
  }

  const testFiles = findTestFiles(fullTargetPath);

  for (const file of testFiles) {
    try {
      execCommand(`bun test ${file}`);
    } catch (_) { }
  }
};

const printHelp = (): void => {
  const cmd = (text: string) => colorize("#FFA500", text);
  const dim = (text: string) => colorize("#888888", text);
  const section = (text: string) => colorize("#FFFFFF", text);

  console.log(`
Usage: ${cmd("harpia")} ${dim("<command> [options]")}

${section("Application")}
  ${cmd("start")}              Start the application in production mode
  ${cmd("dev")}                Start the application in development mode ${dim("(hot reload)")}

${section("Scaffolding")}
  ${cmd("generate")}           Interactively generate a new file
                       ${dim("Available: module, controller, middleware,")}
                       ${dim("test, factory, seed, task, validation, observer, setup")}

${section("Database")}
  ${cmd("migrate")}            Generate Prisma client and run pending migrations
  ${cmd("deploy")}             Generate Prisma client and deploy migrations to production
  ${cmd("seed")} ${dim("[name]")}        Run all seeders, or a specific one by name
  ${cmd("studio")}             Open Prisma Studio

${section("Quality")}
  ${cmd("tests")} ${dim("[module]")}     Run tests for all modules, or a specific one
    ${dim("--sequential")}     Run tests one file at a time ${dim("(avoids conflicts)")}
  ${cmd("lint")} ${dim("[module]")}      Lint all modules, or a specific one

${section("Options")}
  ${cmd("--help")}, ${cmd("-h")}         Show this help message

${section("Examples")}
  ${dim("harpia dev")}
  ${dim("harpia generate module")}
  ${dim("harpia tests auth --sequential")}
  ${dim("harpia seed UserSeeder")}
  ${dim("harpia lint auth")}
`);
};

export const run = (script: string, args: string[]): void => {
  const commands: any = {
    // Start application
    start: () => {
      const appMode: Mode = (process.env.MODE as Mode) || "api";

      if (appMode === "fullstack") {
        execCommand("clear && bun build ./resources/assets/js/scripts.js --outfile ./public/js/bundle.js");
        execCommand("clear && bun start/server.ts");
      } else {
        execCommand("clear && bun start/server.ts");
      }
    },
    dev: async () => {
      const tailwindExists = await checkDependency("tailwindcss");
      const appMode: Mode = (process.env.MODE as Mode) || "api";

      if (appMode === "fullstack") {
        if (tailwindExists) {
          await Promise.all([
            Bun.$`bun --hot start/server.ts`,
            Bun.$`bun tailwindcss -i ./resources/assets/css/tailwind.css -o ./public/css/styles.css --watch`,
            Bun.$`bun build --watch ./resources/assets/js/scripts.js --outfile ./public/js/bundle.js`,
          ]);
        } else {
          await Promise.all([
            Bun.$`bun --hot start/server.ts`,
            Bun.$`bun build --watch ./resources/assets/js/scripts.js --outfile ./public/js/bundle.js`,
          ]);
        }
      } else {
        execCommand("clear && bun --hot start/server.ts");
      }
    },

    // Utilities
    tests: () => {
      const shouldRunInBand = args.includes("--runInBand") || args.includes("--sequential");
      const filteredArgs = args.filter((arg) => !arg.startsWith("--"));
      const firstArg = filteredArgs[0];

      if (shouldRunInBand) {
        const target = firstArg ? `modules/${firstArg}/tests` : "modules";

        const startTime = performance.now();
        testSequential(target);
        const endTime = performance.now();
        const totalTime = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`⏱️  Total time for tests: ${totalTime} seconds`);

        return;
      }

      if (!firstArg) {
        execCommand("bun test modules");
        return;
      }

      const paths = firstArg.split("/");
      const moduleDir = paths.shift();
      const testFile = paths.pop();
      const directories = paths.join("/");

      if (!moduleDir) {
        process.exit(1);
      }

      if (!testFile) {
        execCommand(`bun test modules/${moduleDir}/tests/`);
      } else {
        execCommand(`bun test modules/${moduleDir}/tests/${directories}/${testFile}.spec.ts`);
      }
    },

    lint: () => {
      const baseCommand = "bunx --bun biome lint --write --unsafe";
      const [moduleDir, filePath] = args;

      if (args.length === 0) {
        execCommand(`${baseCommand} modules`);
      } else if (args.length === 1) {
        execCommand(`${baseCommand} modules/${moduleDir}`);
      } else if (args.length === 2 && filePath) {
        const fileSuffix = filePath.includes("tests/") ? ".spec.ts" : ".ts";
        execCommand(`${baseCommand} modules/${moduleDir}/${filePath}${fileSuffix}`);
      }
    },

    generate: () => {
      const generateArgs = args.join(" ");
      execCommand(`clear && bun ${path.join(__dirname, "../src/commands/modules/index.ts")} ${generateArgs}`);
    },
    studio: () => execCommand("prisma studio"),
    seed: () => {
      const seedName = args[0];
      if (seedName) {
        execCommand(`clear && bun app/database/seeds/index.ts ${seedName}`);
      } else {
        execCommand("clear && bun app/database/seeds/index.ts");
      }
    },
    migrate: () => {
      execCommand("prisma generate");
      execCommand("prisma migrate dev");
      execCommand(`bun ${path.join(__dirname, "../src/commands/database/index.ts")}`);
    },
    deploy: () => {
      execCommand("prisma generate");
      execCommand("prisma migrate deploy");
    },
  };

  if (commands[script]) {
    commands[script](args);
  } else {
    console.log(`Script "${script}" not found`);
  }
};

const [, , script, ...args] = process.argv;

if (!script || script === "--help" || script === "-h") {
  if (script === "--help" || script === "-h") {
    printHelp();
    process.exit(0);
  }

  console.log('No command provided. Run "harpia --help" to see available commands.');
  process.exit(1);
}

run(script, args);
