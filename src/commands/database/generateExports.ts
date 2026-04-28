import { Utils } from "@harpiats/common";

export function generateExports(models: string[]): string {
  const exportString = models.map((model) => `  ${Utils.string.camelCase(model)}: ${model}`).join(",\n");

  return `export const { \n${exportString}\n} = prisma;`;
}
