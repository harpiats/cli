import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function zodIdTypeFromSchema(modelName: string): string {
  const schemaPath = resolve(process.cwd(), "prisma", "schema.prisma");
  const schema = readFileSync(resolve(schemaPath), "utf-8");

  const modelRegex = new RegExp(`model\\s+${modelName}\\s+{([\\s\\S]*?)}`, "m");
  const modelMatch = schema.match(modelRegex);

  if (!modelMatch) {
    throw new Error(`Model "${modelName}" not found in schema.`);
  }

  const modelBody = modelMatch[1];

  if (!modelBody) {
    throw new Error(`Could not parse body of model "${modelName}".`);
  }

  const lines = modelBody.split("\n").map((line) => line.trim());

  for (const line of lines) {
    if (!line.includes("@id")) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const prismaType = parts[1];

    if (prismaType === "String") {
      if (line.includes("@default(uuid())")) return `z.uuid("ID must be a valid UUID.")`;
      if (line.includes("@default(cuid())")) return `z.string().cuid()`;
      return `z.string()`;
    }

    if (["Int", "BigInt", "Float", "Decimal"].includes(prismaType)) {
      return `z.number().int()`;
    }

    return `z.string()`;
  }

  throw new Error(`No @id field found in model "${modelName}".`);
}
