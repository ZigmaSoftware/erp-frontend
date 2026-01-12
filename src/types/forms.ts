import type { ReactNode } from "react";

export type SelectOption<Value = string | number> = {
  value: Value;
  label: ReactNode;
};
