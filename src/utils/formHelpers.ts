export const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return String(value);
  }
  return undefined;
};

export const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    const candidate = toStringValue(value);
    if (candidate !== undefined) return candidate;
  }
  return "";
};

export const toBoolean = (
  value: boolean | string | number | null | undefined
): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
};

export const normalizeRelationId = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "object") {
    const candidate = (value as Record<string, unknown>)["unique_id"] ??
      (value as Record<string, unknown>)["id"];
    if (candidate == null) return "";
    return String(candidate);
  }
  return String(value);
};

export const normalizeNullable = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return String(value);
};

export const includeSelectedOption = <Option extends { value: string }>(
  base: Option[],
  options: Option[],
  selectedId?: string | null
): Option[] => {
  if (!selectedId) return base;
  if (base.some((option) => option.value === selectedId)) return base;
  const selected = options.find((option) => option.value === selectedId);
  return selected ? [...base, selected] : base;
};

export const isOptionActive = (option: { isActive?: boolean }) =>
  option.isActive !== false;

export const resolveOptionValue = (
  value: string | number | null | undefined,
  options: Array<{ value: string }>
) => {
  if (value == null || value === "") return "";
  const normalized = String(value);
  const direct = options.find((option) => option.value === normalized);
  return direct ? direct.value : normalized;
};

export const normalizeStatusLabel = (value?: string | null) =>
  value?.toLowerCase() === "active" ? "Active" : "Inactive";

export const toNumberValue = (
  value: string | number | null | undefined
): number | undefined => {
  if (value == null || value === "") return undefined;
  return Number(value);
};

export const pickSiteId = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record["unique_id"] ?? record["id"];
    if (candidate == null) return "";
    return String(candidate);
  }
  return "";
};

export const deriveStatus = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";
