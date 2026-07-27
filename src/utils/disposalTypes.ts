export const DISPOSAL_TYPE_OPTIONS = [
  { value: "customer_scope", label: "Customer Scope" },
  { value: "zigma_scope", label: "Zigma Scope" },
  { value: "transport_scope", label: "Transport Scope" },
] as const;

export const DISPOSAL_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DISPOSAL_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

export type DisposalTypeValue = (typeof DISPOSAL_TYPE_OPTIONS)[number]["value"];
