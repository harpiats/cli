export function generateTypeExports(models: string[]): string {
	const typeString = models.map((model) => `  ${model} as ${model}Type,`).join("\n");

	return `export type {\n${typeString}\n} from "./prisma/client";`;
}