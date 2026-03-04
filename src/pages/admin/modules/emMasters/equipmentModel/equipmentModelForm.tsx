import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getEncryptedRoute } from "@/utils/routeCache";
import { equipmentModelApi, equipmentTypeApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import { equipmentModelSchema } from "@/validations/emMasters/equipment-model.schema";
import { extractErrorMessage } from "@/utils/errorUtils";
import { normalizeRelationId, toBoolean } from "@/utils/formHelpers";
import type { EquipmentModelDetail } from "@/types/emMasters/forms";

const { encEmMasters, encEquipmentModel } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encEmMasters}/${encEquipmentModel}`;

type EquipmentType = {
  unique_id: string;
  name: string;
  is_active: boolean;
};

type RawEquipmentType = {
  unique_id?: string | number;
  id?: string | number;
  name?: string;
  equipment_type_name?: string;
  is_active?: boolean | string | number | null;
  status?: boolean | string | number | null;
};

const equipmentTypeListQueryKey = [
  ...masterQueryKeys.equipmentTypes,
  "list",
] as const;

const equipmentModelDetailQueryKey = (id: string | undefined) =>
  [...masterQueryKeys.equipmentModels, "detail", id ?? "new"] as const;

const normalizeEquipmentType = (item: RawEquipmentType): EquipmentType | null => {
  const id = item.unique_id ?? item.id;
  if (id == null) return null;

  return {
    unique_id: String(id),
    name: item.name ?? item.equipment_type_name ?? "",
    is_active: toBoolean(item.is_active ?? item.status),
  };
};

export default function EquipmentModelForm() {
  const [equipmentType, setEquipmentType] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const equipmentTypesQuery = useQuery({
    queryKey: equipmentTypeListQueryKey,
    queryFn: async (): Promise<EquipmentType[]> => {
      const response = await equipmentTypeApi.list();
      return response
        .map((item) => normalizeEquipmentType(item as RawEquipmentType))
        .filter((item): item is EquipmentType => item !== null);
    },
  });

  const detailQuery = useQuery({
    queryKey: equipmentModelDetailQueryKey(id),
    queryFn: () => equipmentModelApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data) return;

    const data = detailQuery.data as EquipmentModelDetail;
    setEquipmentType(normalizeRelationId(data.equipment_type));
    setManufacturer(data.manufacturer ?? "");
    setModelName(data.model_name ?? "");
    setDescription(data.description ?? "");
    setIsActive(toBoolean(data.is_active));
  }, [detailQuery.data]);

  useEffect(() => {
    if (!equipmentTypesQuery.error) return;

    Swal.fire({
      icon: "error",
      title: "Failed to load equipment types",
      text: extractErrorMessage(equipmentTypesQuery.error),
    });
  }, [equipmentTypesQuery.error]);

  useEffect(() => {
    if (!detailQuery.error) return;

    Swal.fire({
      icon: "error",
      title: "Failed to load equipment model",
      text: extractErrorMessage(detailQuery.error),
    });
  }, [detailQuery.error]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      equipment_type: string;
      manufacturer: string;
      model_name: string;
      description: string;
      is_active: boolean;
    }) =>
      isEdit
        ? equipmentModelApi.update(id as string, payload)
        : equipmentModelApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.equipmentModels,
      });

      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
      });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = equipmentModelSchema.safeParse({
      equipment_type: equipmentType,
      manufacturer: manufacturer.trim(),
      model_name: modelName.trim(),
      description: description.trim(),
      is_active: isActive,
    });

    if (!validation.success) {
      Swal.fire({
        icon: "error",
        title: "Validation error",
        text: validation.error.issues[0]?.message ?? "Please check the form fields.",
      });
      return;
    }

    saveMutation.mutate(validation.data);
  };

  const equipmentTypes = equipmentTypesQuery.data ?? [];
  const isSubmitting = saveMutation.isPending;
  const isFetchingDetail = detailQuery.isFetching;
  const isFormDisabled = isSubmitting || isFetchingDetail;

  return (
    <div className="p-8">
      <div className="mx-auto bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Equipment Model" : "Add Equipment Model"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>
                Equipment Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={equipmentType || undefined}
                onValueChange={(value) => setEquipmentType(value)}
                disabled={equipmentTypesQuery.isFetching || isFormDisabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type.unique_id} value={type.unique_id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Manufacturer <span className="text-red-500">*</span>
              </Label>
              <Input
                value={manufacturer}
                required
                placeholder="Enter manufacturer"
                onChange={(e) => setManufacturer(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>
                Model Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={modelName}
                required
                placeholder="Enter model name"
                onChange={(e) => setModelName(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Active Status</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(value) => setIsActive(value === "true")}
                disabled={isFormDisabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                rows={3}
                value={description}
                placeholder="Optional description"
                onChange={(e) => setDescription(e.target.value)}
                disabled={isFormDisabled}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                ? "Update"
                : "Save"}
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate(ENC_LIST_PATH)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
