import { readFileSync } from "node:fs";

interface SchemaRule {
  $ref?: string;
  type?: "object" | "array" | "string" | "number" | "boolean";
  enum?: readonly unknown[];
  required?: readonly string[];
  additionalProperties?: boolean;
  dependentRequired?: Record<string, readonly string[]>;
  properties?: Record<string, SchemaRule>;
  items?: SchemaRule;
  maxItems?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  $defs?: Record<string, SchemaRule>;
}

const schema = JSON.parse(readFileSync(new URL("../references/figure-scene.schema.json", import.meta.url), "utf8")) as SchemaRule;

function reject(location: string, message: string): never {
  throw new Error(location + ": " + message);
}

function checkDependencies(value: Record<string, unknown>, requirement: { key: string; dependencies: readonly string[] }, location: string): void {
  if (!Object.hasOwn(value, requirement.key)) return;
  for (const dependency of requirement.dependencies) {
    if (!Object.hasOwn(value, dependency)) reject(location + "." + dependency, "is required with " + requirement.key);
  }
}

function checkObject(value: Record<string, unknown>, rule: SchemaRule, location: string): void {
  for (const key of rule.required ?? []) {
    if (!Object.hasOwn(value, key)) reject(location + "." + key, "is required");
  }
  for (const [key, dependencies] of Object.entries(rule.dependentRequired ?? {})) {
    checkDependencies(value, { key, dependencies }, location);
  }
  for (const [key, item] of Object.entries(value)) {
    const child = rule.properties?.[key];
    if (child === undefined && rule.additionalProperties === false) reject(location + "." + key, "is not a recognized field");
    if (child !== undefined) checkValue(item, child, location + "." + key);
  }
}

function checkArray(value: readonly unknown[], rule: SchemaRule, location: string): void {
  if (rule.maxItems !== undefined && value.length > rule.maxItems) reject(location, "exceeds maxItems " + rule.maxItems);
  const itemRule = rule.items;
  if (itemRule === undefined) return;
  value.forEach((item, index) => checkValue(item, itemRule, location + "[" + index + "]"));
}

function checkString(value: string, rule: SchemaRule, location: string): void {
  if (rule.maxLength !== undefined && Array.from(value).length > rule.maxLength) reject(location, "exceeds maxLength " + rule.maxLength);
  if (rule.pattern !== undefined && !new RegExp(rule.pattern).test(value)) reject(location, "must match " + rule.pattern);
}

function checkNumber(value: number, rule: SchemaRule, location: string): void {
  if (!Number.isFinite(value)) reject(location, "must be finite");
  if (rule.minimum !== undefined && value < rule.minimum) reject(location, "must be at least " + rule.minimum);
  if (rule.maximum !== undefined && value > rule.maximum) reject(location, "must be at most " + rule.maximum);
  if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum) reject(location, "must be greater than " + rule.exclusiveMinimum);
}

function checkValue(value: unknown, source: SchemaRule, location: string): void {
  const rule = source.$ref === undefined ? source : schema.$defs?.[source.$ref.replace("#/$defs/", "")];
  if (rule === undefined) reject(location, "has an unresolved schema reference");
  if (rule.enum !== undefined && !rule.enum.includes(value)) reject(location, "must be one of " + rule.enum.join(", "));
  if (rule.type === undefined) return;
  if (value === null) reject(location, "must be " + rule.type);
  if (rule.type === "object") {
    if (typeof value !== "object" || Array.isArray(value)) reject(location, "must be an object");
    checkObject(value as Record<string, unknown>, rule, location);
    return;
  }
  if (rule.type === "array") {
    if (!Array.isArray(value)) reject(location, "must be an array");
    checkArray(value, rule, location);
    return;
  }
  if (typeof value !== rule.type) reject(location, "must be " + rule.type);
  if (typeof value === "string") checkString(value, rule, location);
  if (typeof value === "number") checkNumber(value, rule, location);
}

export function validateSceneSchema(value: unknown): void {
  checkValue(value, schema, "scene");
}
