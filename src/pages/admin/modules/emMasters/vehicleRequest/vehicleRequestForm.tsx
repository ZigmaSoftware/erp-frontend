import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrashBinIcon } from "@/icons";
import { equipmentModelApi, siteApi, userCreationApi, vehicleRequestApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

type SelectOption = {
  value: string;
  label: string;
};

type ItemRow = {
  id: string;
  equipment_model?: string;
  qty?: string;
  unit?: string;
  purpose?: string;
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: "draft", label: "Draft" },
  { value: "requested", label: "Requested" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const createRowId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

const createItemRow = (overrides: Partial<ItemRow> = {}): ItemRow => ({
  id: createRowId(),
  equipment_model: "",
  qty: "",
  unit: "",
  purpose: "",
  ...overrides,
});

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return String(value);
  }
  return undefined;
};

const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    const normalized = toStringValue(value);
    if (normalized !== undefined) {
      return normalized;
    }
  }
  return "";
};

const asArray = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value : [];
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const errorRecord = error as Record<string, unknown>;
    const response = asRecord(errorRecord["response"]);
    const data = asRecord(response?.["data"]);
    const detailMessage = pickFirstString(data?.["detail"], data?.["message"]);
    if (detailMessage) {
      return detailMessage;
    }
  }
  return fallback;
};

const normalizeItemRow = (item: Record<string, unknown>): ItemRow => {
  const modelRecord = asRecord(item["equipment_model"]);
  const equipmentModel = pickFirstString(
    item["equipment_model"],
    item["equipment_model_id"],
    item["model"],
    modelRecord?.["unique_id"],
    modelRecord?.["id"]
  );

  const qtyValue =
    item["qty"] ??
    item["quantity"] ??
    item["qty_requested"];
  const qty =
    typeof qtyValue === "number"
      ? String(qtyValue)
      : toStringValue(qtyValue) ?? "";

  return {
    id: pickFirstString(item["unique_id"], item["id"]) || createRowId(),
    equipment_model: equipmentModel,
    qty,
    unit: pickFirstString(item["unit"], item["uom"]) ?? "",
    purpose: pickFirstString(item["purpose"], item["remarks"]) ?? "",
  };
};

const toSelectOptions = (
  list: unknown[],
  getId: (item: Record<string, unknown>) => string,
  getLabel: (item: Record<string, unknown>) => string
): SelectOption[] => {
  return list
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const value = getId(item);
      const label = getLabel(item);
      if (!value || !label) return null;
      return { value, label };
    })
    .filter(Boolean) as SelectOption[];
};

const resolveModelLabel = (model: Record<string, unknown>) => {
  const name = pickFirstString(model["model_name"], model["name"]);
  if (name) {
    return name;
  }

  const fallback = `${pickFirstString(model["manufacturer"])} ${pickFirstString(
    model["model_name"],
    model["name"]
  )}`.trim();

  return fallback || pickFirstString(model["manufacturer"]) || "";
};

const resolveSiteLabel = (site: Record<string, unknown>) =>
  pickFirstString(site["site_name"], site["name"], site["display_name"]);

const resolveStaffLabel = (staff: Record<string, unknown>) => {
  const firstName = pickFirstString(staff["first_name"]);
  const lastName = pickFirstString(staff["last_name"]);

  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }

  return pickFirstString(staff["username"], staff["email"]);
};

const UNIT_OPTIONS: SelectOption[] = [
  { value: "nos", label: "nos" },
  { value: "hrs", label: "hrs" },
  { value: "days", label: "days" },
];

export default function VehicleRequestForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { encEmMasters, encVehicleRequest } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encEmMasters}/${encVehicleRequest}`;

  const [description, setDescription] = useState("");
  const [siteId, setSiteId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [requestStatus, setRequestStatus] = useState(STATUS_OPTIONS[0].value);
  const [items, setItems] = useState<ItemRow[]>([createItemRow()]);

  const [equipmentModels, setEquipmentModels] = useState<SelectOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<SelectOption[]>([]);

  const [lookupLoading, setLookupLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isBusy = lookupLoading || (isEdit && recordLoading);

  const loadLookups = useCallback(async () => {
    setLookupLoading(true);
    try {
      const [models, sites, users] = (await Promise.all([
        equipmentModelApi.list(),
        siteApi.list(),
        userCreationApi.list(),
      ])) as [unknown[], unknown[], unknown[]];

      setEquipmentModels(
        toSelectOptions(
          Array.isArray(models) ? models : [],
          (item) =>
            pickFirstString(item["unique_id"], item["id"], item["model_id"], item["model"]),
          (item) => resolveModelLabel(item)
        )
      );

      setSiteOptions(
        toSelectOptions(
          Array.isArray(sites) ? sites : [],
          (item) =>
            pickFirstString(item["unique_id"], item["id"], item["site_id"]),
          (item) => resolveSiteLabel(item)
        )
      );

      const staffList = (Array.isArray(users) ? users : [])
        .map(asRecord)
        .filter((maybeUser): maybeUser is Record<string, unknown> => {
          if (!maybeUser) return false;
          return Boolean(maybeUser["is_staff"]);
        });

      setStaffOptions(
        toSelectOptions(
          staffList,
          (item) =>
            pickFirstString(item["unique_id"], item["id"], item["user_id"]),
          (item) => resolveStaffLabel(item)
        )
      );
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Unable to load lookup data", "error");
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    if (!isEdit || !id) return;

    const loadRequest = async () => {
      setRecordLoading(true);
      try {
      const response = await vehicleRequestApi.get(id);
      const payload = (response?.data ?? response) as Record<string, unknown>;

      setDescription(pickFirstString(payload["description"]));
      setSiteId(
        pickFirstString(
          payload["site"],
          payload["site_id"],
          asRecord(payload["site"])?.["unique_id"],
          asRecord(payload["site"])?.["id"]
        )
      );
      setStaffId(
        pickFirstString(
          payload["staff"],
          payload["staff_id"],
          asRecord(payload["staff"])?.["unique_id"],
          asRecord(payload["staff"])?.["id"]
        )
      );
      setRequestStatus(
        pickFirstString(payload["request_status"], payload["status"]) ||
          STATUS_OPTIONS[0].value
      );

      const rawItems =
        asArray(payload["items"]).length > 0
          ? asArray(payload["items"])
          : asArray(payload["request_items"]).length > 0
            ? asArray(payload["request_items"])
            : asArray(payload["items_data"]);

      setItems(
        rawItems.length > 0
          ? rawItems.map((item) => normalizeItemRow(asRecord(item) ?? {}))
          : [createItemRow()]
      );
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Unable to load vehicle request", "error");
      } finally {
        setRecordLoading(false);
      }
    };

    loadRequest();
  }, [id, isEdit]);

  const updateItem = (
    id: string,
    field: keyof Omit<ItemRow, "id">,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createItemRow()]);
  };

  const removeItem = (rowId: string) => {
    setItems((prev) => {
      const remaining = prev.filter((item) => item.id !== rowId);
      return remaining.length ? remaining : [createItemRow()];
    });
  };

  const validate = () => {
    if (!siteId) {
      Swal.fire("Validation error", "Please select a site", "error");
      return false;
    }

    if (!staffId) {
      Swal.fire("Validation error", "Please select a staff member", "error");
      return false;
    }

    const filledItems = items.filter((item) => item.equipment_model);
    if (!filledItems.length) {
      Swal.fire("Validation error", "Add at least one item", "error");
      return false;
    }

    for (const item of filledItems) {
      if (!item.qty || Number(item.qty) <= 0) {
        Swal.fire("Validation error", "Item quantity must be greater than 0", "error");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      description,
      site: siteId,
      staff: staffId,
      request_status: requestStatus,
      items: items
        .filter((item) => item.equipment_model)
        .map((item) => ({
          equipment_model: item.equipment_model,
          qty: Number(item.qty),
          unit: item.unit?.trim() ?? "",
          purpose: item.purpose?.trim() ?? "",
        })),
    };

    setSubmitting(true);
    try {
      if (isEdit && id) {
        console.log(payload);
        await vehicleRequestApi.update(id, payload);
        Swal.fire({
          icon: "success",
          title: "Vehicle request updated",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await vehicleRequestApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Vehicle request created",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: unknown) {
      console.error(error);
      const message = getErrorMessage(error, "Unable to save vehicle request");
      Swal.fire("Error", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (isBusy) {
    return (
      <div className="p-3">
        <ComponentCard title={isEdit ? "Edit Vehicle Request" : "New Vehicle Request"}>
          <p className="text-sm text-gray-500">Loading request data…</p>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="p-3">
      <ComponentCard title={isEdit ? "Edit Vehicle Request" : "New Vehicle Request"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>
                Site <span className="text-red-500">*</span>
              </Label>
              <Select
                value={siteId || undefined}
                onValueChange={(value) => setSiteId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Staff <span className="text-red-500">*</span>
              </Label>
              <Select
                value={staffId || undefined}
                onValueChange={(value) => setStaffId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={requestStatus}
                onValueChange={(value) => setRequestStatus(value ?? STATUS_OPTIONS[0].value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context for this request"
            />
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 border border-dashed border-gray-200 rounded-lg p-4 bg-white shadow-sm md:grid-cols-[2fr,1fr,1fr,1fr,auto]"
              >
                <div>
                  <Label>
                    Equipment Model <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={item.equipment_model || undefined}
                    onValueChange={(value) =>
                      updateItem(item.id, "equipment_model", value ?? "")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentModels.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Qty *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.qty ?? ""}
                    onChange={(event) =>
                      updateItem(item.id, "qty", event.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Unit</Label>
                  <Select
                    value={item.unit || undefined}
                    onValueChange={(value) =>
                      updateItem(item.id, "unit", value ?? "")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Input
                    value={item.purpose ?? ""}
                    onChange={(event) =>
                      updateItem(item.id, "purpose", event.target.value)
                    }
                  />
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    title="Remove item"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => removeItem(item.id)}
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            disabled={submitting}
          >
            + Add item
          </Button>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ENC_LIST_PATH)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEdit ? "Update Request" : "Save Request"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
