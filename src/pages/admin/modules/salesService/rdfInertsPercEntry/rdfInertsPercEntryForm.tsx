import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Plus, Trash2 } from "lucide-react";

import ComponentCard from "@/components/common/ComponentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rdfInertsPercEntryServiceApi, siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import { normalizeRelationId } from "@/utils/formHelpers";
import type {
  RdfInertsItemType,
  RdfInertsPercEntry,
  RdfInertsPercEntrySub,
} from "../types/salesService.types";

type SiteOption = {
  unique_id: string;
  site_name: string;
  screen_name?: string | null;
  is_active?: boolean;
};

type DetailRow = {
  id: string;
  perc_date: string;
  perc_item_name: RdfInertsItemType | "";
  perc_item_percentage: string;
  perc_status: boolean;
};

const ITEM_TYPES: RdfInertsItemType[] = ["RDF", "Inerts"];

const today = () => new Date().toISOString().slice(0, 10);

const buildYearMonth = (date: string) => {
  const [year, month] = (date || today()).split("-");
  return year && month ? `${year.slice(2)}${month}` : today().slice(2, 7).replace("-", "");
};

const buildSiteCode = (site?: SiteOption) => {
  if (!site) return "";
  const source = site.screen_name || site.site_name;
  return source.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 3);
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createEmptyRow = (): DetailRow => ({
  id: crypto.randomUUID(),
  perc_date: today(),
  perc_item_name: "",
  perc_item_percentage: "",
  perc_status: true,
});

const toRow = (item: RdfInertsPercEntrySub): DetailRow => ({
  id: item.unique_id || crypto.randomUUID(),
  perc_date: item.perc_date ?? today(),
  perc_item_name: item.perc_item_name ?? "",
  perc_item_percentage: String(item.perc_item_percentage ?? ""),
  perc_status: item.perc_status ?? true,
});

export default function RdfInertsPercEntryForm() {
  const [entryNo, setEntryNo] = useState("Auto Generated");
  const [siteName, setSiteName] = useState("");
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [existingEntries, setExistingEntries] = useState<RdfInertsPercEntry[]>([]);
  const [rows, setRows] = useState<DetailRow[]>([createEmptyRow()]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encRdfInertsPercEntry } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encRdfInertsPercEntry}`;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [siteList, entryList] = await Promise.all([
          siteApi.list(),
          rdfInertsPercEntryServiceApi.list(),
        ]);
        setSites(
          (siteList as SiteOption[]).filter((site) => site.is_active !== false),
        );
        setExistingEntries(entryList as RdfInertsPercEntry[]);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load form details",
          text: "Something went wrong!",
        });
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    // Sales Service no longer resolves a site_id for us (it has no local
    // copy of Master Service's Site data) - it returns the plain site_name
    // string, so we wait for the site list to load and match by name.
    if (!isEdit || sites.length === 0) return;

    const loadEntry = async () => {
      setFetching(true);
      try {
        const res = await rdfInertsPercEntryServiceApi.get(id as string);
        const data = (res?.data || res) as RdfInertsPercEntry;
        setEntryNo(data.ri_perc_entry_no || "Auto Generated");
        const matchedSite = sites.find((site) => site.site_name === data.site_name);
        setSiteName(matchedSite?.unique_id ?? normalizeRelationId(data.site_name));
        setRows(
          Array.isArray(data.items) && data.items.length > 0
            ? data.items.map(toRow)
            : [
                {
                  id: data.unique_id,
                  perc_date: data.perc_date,
                  perc_item_name: data.perc_item_name,
                  perc_item_percentage: String(data.perc_item_percentage ?? ""),
                  perc_status: data.perc_status ?? true,
                },
              ],
        );
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load RDF & Inerts percentage entry",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadEntry();
  }, [isEdit, id, sites]);

  const updateRow = <Key extends keyof DetailRow>(
    rowId: string,
    key: Key,
    value: DetailRow[Key],
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (rowId: string) => {
    setRows((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== rowId),
    );
  };

  const validateRows = () => {
    if (!siteName) return "Site Name is required.";
    if (rows.length === 0) return "At least one item row is required.";

    for (const [index, row] of rows.entries()) {
      const rowNo = index + 1;
      if (!row.perc_date) return `Date is required in row ${rowNo}.`;
      if (!row.perc_item_name) return `Item Type is required in row ${rowNo}.`;
      if (row.perc_item_percentage === "") {
        return `Percentage is required in row ${rowNo}.`;
      }
      const percentage = Number(row.perc_item_percentage);
      if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
        return `Percentage must be between 0 and 100 in row ${rowNo}.`;
      }
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateRows();
    if (validationError) {
      Swal.fire({
        icon: "warning",
        title: "Validation failed",
        text: validationError,
      });
      return;
    }

    setLoading(true);

    const firstRow = rows[0];
    // Sales Service stores `site_name` as a plain string (no local Site
    // table to resolve a unique_id against), so resolve the human-readable
    // name from the already-fetched site list before submitting.
    const selectedSiteName =
      sites.find((site) => site.unique_id === siteName)?.site_name ?? siteName;
    const payload = {
      site_name: selectedSiteName,
      perc_date: firstRow.perc_date,
      perc_item_name: firstRow.perc_item_name,
      perc_item_percentage: firstRow.perc_item_percentage,
      perc_status: firstRow.perc_status,
      is_active: firstRow.perc_status,
      items_data: rows.map((row) => ({
        perc_date: row.perc_date,
        perc_item_name: row.perc_item_name,
        perc_item_percentage: row.perc_item_percentage,
        perc_status: row.perc_status,
        is_active: row.perc_status,
      })),
    };

    try {
      if (isEdit) {
        await rdfInertsPercEntryServiceApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await rdfInertsPercEntryServiceApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: unknown) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || fetching;

  const entryNoPreview = useMemo(() => {
    if (isEdit) return entryNo;

    const yearMonth = buildYearMonth(rows[0]?.perc_date ?? today());
    const selectedSite = sites.find((site) => site.unique_id === siteName);
    const siteCode = buildSiteCode(selectedSite);
    const prefix = siteCode
      ? `Perc-RI-${siteCode}-${yearMonth}-`
      : `Perc-RI-${yearMonth}-`;
    const matcher = siteCode
      ? new RegExp(`^Perc-RI-${escapeRegExp(siteCode)}-${yearMonth}-(\\d+)$`, "i")
      : new RegExp(`^Perc-RI-(?:[A-Z0-9]{3}-)?${yearMonth}-(\\d+)$`, "i");

    const maxSerial = existingEntries.reduce((max, entry) => {
      const match = entry.ri_perc_entry_no?.match(matcher);
      if (!match) return max;
      const serial = Number(match[1]);
      return Number.isNaN(serial) ? max : Math.max(max, serial);
    }, 0);

    return `${prefix}${String(maxSerial + 1).padStart(4, "0")}`;
  }, [entryNo, existingEntries, isEdit, rows, siteName, sites]);

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "RDF & Inerts % Form" : "Add New RDF & Inerts %"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Entry No</Label>
              <Input
                value={entryNoPreview}
                readOnly
                className="font-semibold text-red-600"
              />
            </div>

            <div>
              <Label>Site Name *</Label>
              <Select
                value={siteName || undefined}
                onValueChange={setSiteName}
                disabled={isFormDisabled}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.unique_id} value={site.unique_id}>
                      {site.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="border px-3 py-2 text-left w-16">S.no</th>
                  <th className="border px-3 py-2 text-left min-w-44">Date *</th>
                  <th className="border px-3 py-2 text-left min-w-56">
                    Item Type *
                  </th>
                  <th className="border px-3 py-2 text-left min-w-52">
                    Percentage *
                  </th>
                  <th className="border px-3 py-2 text-left min-w-44">
                    Status *
                  </th>
                  <th className="border px-3 py-2 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border px-3 py-2">{index + 1}</td>
                    <td className="border px-3 py-2">
                      <Input
                        type="date"
                        value={row.perc_date}
                        onChange={(e) =>
                          updateRow(row.id, "perc_date", e.target.value)
                        }
                        disabled={isFormDisabled}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <Select
                        value={row.perc_item_name || undefined}
                        onValueChange={(value) =>
                          updateRow(
                            row.id,
                            "perc_item_name",
                            value as RdfInertsItemType,
                          )
                        }
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map((itemType) => (
                            <SelectItem key={itemType} value={itemType}>
                              {itemType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={row.perc_item_percentage}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "perc_item_percentage",
                            e.target.value,
                          )
                        }
                        disabled={isFormDisabled}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <Select
                        value={row.perc_status ? "true" : "false"}
                        onValueChange={(value) =>
                          updateRow(row.id, "perc_status", value === "true")
                        }
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">In Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          onClick={addRow}
                          disabled={isFormDisabled}
                          title="Add row"
                        >
                          <Plus className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => removeRow(row.id)}
                          disabled={isFormDisabled || rows.length === 1}
                          title="Remove row"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "Update" : "Submit"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate(ENC_LIST_PATH)}
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
