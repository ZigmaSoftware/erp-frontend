import { machineryHireApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { MachineryHireRecord } from "@/types/tanstack/masters";
import { enterpriseQuery } from "../enterpriseQuery";

const queryKey = masterQueryKeys.machineryHires;

export function useMachineryHiresQuery() {
  return enterpriseQuery<MachineryHireRecord[]>({
    queryKey,
    queryFn: () => machineryHireApi.list(),
  });
}
