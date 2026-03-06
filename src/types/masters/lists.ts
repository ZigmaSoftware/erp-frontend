import type { PaginatedResponse } from "@/helpers/admin/crudHelpers";
import type { SiteRecord } from "@/types/tanstack/masters";

export type PaginatedSites = PaginatedResponse<SiteRecord>;

export type SiteTableRow = SiteRecord & {
  state: string;
  district: string;
  status: "Active" | "Inactive";
};
