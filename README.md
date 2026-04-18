# @harpia/cli

The official Command Line Interface (CLI) tool for the Harpia framework.

## Features
- **Scaffolding**: Automatically generate modules, controllers, middlewares, services, repositories, validations, tasks, and observers.
- **Workflow Management**: Start the development server with hot-reload, run tests, and format code.
- **Database Introspection**: Run migrations, seed the database, and invoke Prisma Studio directly.

## Usage
When using the Harpia boilerplate (`/app`), the CLI is invoked through the local `cmd.ts` wrapper.
You can run commands effortlessly:
```bash
bun g module User
bun g controller api TestController
```

Or you can use the CLI directly if installed or referenced via package scripts:
```bash
bun harpia <command> [args]
```

To see all available commands and options, use the `--help` flag:
```bash
bun harpia --help
```

## Commands
| Command | Description |
|---|---|
| `generate` (or `g` via wrapper) | Generates a new component (module, controller, config, etc.) |
| `start` | Starts the server in production mode |
| `dev` | Starts the server in development mode with hot-reload |
| `tests` | Runs the test suite |
| `lint` | Runs the Biome linter |
| `studio` | Opens Prisma Studio |
| `seed` | Runs the database seeders |
| `migrate` | Connects, generates prisma client and runs database migrations |
| `deploy` | Runs pending database migrations in production |
