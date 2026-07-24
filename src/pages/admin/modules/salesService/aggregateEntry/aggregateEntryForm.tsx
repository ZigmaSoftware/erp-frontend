import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Plus, Trash2 } from "lucide-react";

import ComponentCard from "@/components/common/ComponentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  aggregateEntryApi,
  siteApi,
  plantApi,
  itemCreationServiceApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { AggregateEntry, AggregateEntrySub } from "../types/salesService.types";

type SiteOption = { unique_id: string; site_name: string; is_active?: boolean };
type PlantOption = {
  unique_id: string;
  plant_name: string;
  site_id?: string | null;
  is_active?: boolean;
};
type ItemOption = { unique_id: string; item_name: string; is_active?: boolean };

/* One editable By-Product row (client-side only until Submit). */
type DetailRow = {
  id: string;
  item_name: string; // Item master unique_id
  stock: string;
  receipt: string;
  remarks: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const createEmptyRow = (): DetailRow => ({
  id: crypto.randomUUID(),
  item_name: "",
  stock: "",
  receipt: "",
  remarks: "",
});

const toRow = (item: AggregateEntrySub): DetailRow => ({
  id: item.unique_id || crypto.randomUUID(),
  item_name: item.item_name ?? "",
  stock: item.stock != null ? String(item.stock) : "",
  receipt: item.receipt != null ? String(item.receipt) : "",
  remarks: item.remarks ?? "",
});

export default function AggregateEntryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encAggregateEntry } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encAggregateEntry}`;

  /* ---------------- Header state ---------------- */
  const [entryNo, setEntryNo] = useState("Auto Generated");
  const [entryDate, setEntryDate] = useState(today());
  const [siteId, setSiteId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [description, setDescription] = useState("");

  /* ---------------- Sub-row state ---------------- */
  const [rows, setRows] = useState<DetailRow[]>([createEmptyRow()]);

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [plants, setPlants] = useState<PlantOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [siteList, plantList, itemList] = await Promise.all([
          siteApi.list(),
          plantApi.list(),
          itemCreationServiceApi.list(),
        ]);
        setSites((siteList as SiteOption[]).filter((s) => s.is_active !== false));
        setPlants(plantList as PlantOption[]);
        setItems((itemList as ItemOption[]).filter((i) => i.is_active !== false));
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load dropdown options",
          text: "Something went wrong!",
        });
      }
    };

    loadOptions();
  }, []);

  /* Plants filtered by the selected site. */
  const plantOptions = useMemo(
    () => plants.filter((p) => !siteId || String(p.site_id ?? "") === siteId),
    [plants, siteId],
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await aggregateEntryApi.get(id as string);
        const data = (res?.data || res) as AggregateEntry;

        setEntryNo(data.scrap_no || "Auto Generated");
        setEntryDate((data.entry_date ?? today()).slice(0, 10));
        setSiteId(data.site_name ?? ""); // site_name stores the Site master ID
        setPlantId(data.plant_name ?? ""); // plant_name stores the Plant master ID
        setDescription(data.description ?? "");
        setRows(
          Array.isArray(data.sub_items) && data.sub_items.length > 0
            ? data.sub_items.map(toRow)
            : [createEmptyRow()],
        );
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load aggregate entry",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     ROW HELPERS
  ----------------------------------------------------------- */
  const updateRow = <Key extends keyof DetailRow>(
    rowId: string,
    key: Key,
    value: DetailRow[Key],
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

  const removeRow = (rowId: string) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== rowId)));

  const handleSiteChange = (value: string) => {
    setSiteId(value);
    setPlantId(""); // reset dependent plant when site changes
  };

  /* -----------------------------------------------------------
     VALIDATION
  ----------------------------------------------------------- */
  const validate = (): string => {
    if (!entryDate) return "Date is required.";
    if (!siteId) return "Site Name is required.";
    if (!plantId) return "Plant Name is required.";

    const filled = rows.filter((r) => r.item_name || r.receipt || r.stock || r.remarks);
    if (filled.length === 0) return "At least one By-Product row is required.";

    for (const [index, row] of filled.entries()) {
      const no = index + 1;
      if (!row.item_name) return `Description of By-Product is required in row ${no}.`;
      if (row.receipt === "") return `Receipt (kgs) is required in row ${no}.`;
      const receipt = Number(row.receipt);
      if (Number.isNaN(receipt) || receipt <= 0) {
        return `Receipt (kgs) must be greater than zero in row ${no}.`;
      }
      if (row.stock !== "") {
        const stock = Number(row.stock);
        if (Number.isNaN(stock) || stock < 0) {
          return `Stock must be a valid non-negative number in row ${no}.`;
        }
      }
    }
    return "";
  };

  /* -----------------------------------------------------------
     SUBMIT
  ----------------------------------------------------------- */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      Swal.fire({ icon: "warning", title: "Validation failed", text: validationError });
      return;
    }

    setLoading(true);

    const payload = {
      entry_date: entryDate,
      site_name: siteId, // store Site master ID
      plant_name: plantId, // store Plant master ID
      description: description.trim(),
      sub_items: rows
        .filter((r) => r.item_name && r.receipt !== "")
        .map((r) => ({
          item_name: r.item_name, // store Item master ID
          stock: r.stock || "0",
          receipt: r.receipt,
          remarks: r.remarks.trim(),
        })),
    };

    try {
      if (isEdit) {
        await aggregateEntryApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await aggregateEntryApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      navigate(ENC_LIST_PATH);
    } catch (error) {
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

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Aggregate Entry" : "Add New Aggregate Entry"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Aggregate Entry No</Label>
              <Input value={entryNo} readOnly className="font-semibold text-red-600" />
            </div>

            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </div>

            <div>
              <Label>Site Name *</Label>
              <Select
                value={siteId || undefined}
                onValueChange={handleSiteChange}
                disabled={isFormDisabled}
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

            <div>
              <Label>Plant Name *</Label>
              <Select
                value={plantId || undefined}
                onValueChange={setPlantId}
                disabled={isFormDisabled || !siteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {plantOptions.map((plant) => (
                    <SelectItem key={plant.unique_id} value={plant.unique_id}>
                      {plant.plant_name}
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
                  <th className="border px-3 py-2 text-left w-16">S.No</th>
                  <th className="border px-3 py-2 text-left min-w-56">
                    Description of By-Product *
                  </th>
                  <th className="border px-3 py-2 text-right min-w-32">Stock</th>
                  <th className="border px-3 py-2 text-right min-w-32">Receipt (kgs) *</th>
                  <th className="border px-3 py-2 text-left min-w-52">Remarks</th>
                  <th className="border px-3 py-2 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border px-3 py-2">{index + 1}</td>
                    <td className="border px-3 py-2">
                      <Select
                        value={row.item_name || undefined}
                        onValueChange={(value) => updateRow(row.id, "item_name", value)}
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.unique_id} value={item.unique_id}>
                              {item.item_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border px-3 py-2">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={row.stock}
                        onChange={(e) => updateRow(row.id, "stock", e.target.value)}
                        disabled={isFormDisabled}
                        className="text-right"
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={row.receipt}
                        onChange={(e) => updateRow(row.id, "receipt", e.target.value)}
                        disabled={isFormDisabled}
                        className="text-right"
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <Input
                        value={row.remarks}
                        onChange={(e) => updateRow(row.id, "remarks", e.target.value)}
                        disabled={isFormDisabled}
                        placeholder="Remarks"
                      />
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

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isFormDisabled}
              placeholder="Description"
              rows={3}
            />
          </div>

          <div className="flex justify-center gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "UPDATE" : "SUBMIT"}
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
