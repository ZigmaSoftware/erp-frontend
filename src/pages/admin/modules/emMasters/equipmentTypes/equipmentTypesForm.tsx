import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { getEncryptedRoute } from "@/utils/routeCache";
import { equipmentTypeApi } from "@/helpers/admin";
import type { EquipmentTypeRecord } from "@/types/tanstack/masters";
import {
  equipmentTypeSchema,
  type EquipmentTypeFormValues,
} from "@/validations/emMasters/equipment-type.schema";

const { encEmMasters, encEquipmentType } = getEncryptedRoute();
const LIST_PATH = `/${encEmMasters}/${encEquipmentType}`;
const equipmentTypesQueryKey = ["em-masters", "equipment-types"] as const;

const getStringValue = (...values: unknown[]) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() !== "") return value;
    if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  }
  return "";
};

const deriveStatus = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

export default function EquipmentTypeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EquipmentTypeFormValues>({
    resolver: zodResolver(equipmentTypeSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      is_active: true,
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const detailQuery = useQuery<EquipmentTypeRecord>({
    queryKey: [...equipmentTypesQueryKey, "detail", id ?? "new"],
    queryFn: () => equipmentTypeApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    const payload = ((detailQuery.data as any)?.data ?? detailQuery.data) as EquipmentTypeRecord;

    reset({
      name: getStringValue(payload.name, payload.equipment_type_name),
      category: getStringValue(payload.category),
      description: getStringValue(payload.description),
      is_active: deriveStatus(payload.is_active),
    });
    setExistingImage(getStringValue(payload.image, payload.image_url));
    setImageFile(null);
  }, [detailQuery.data, reset]);

  useEffect(() => {
    if (detailQuery.error) {
      Swal.fire("Error", "Failed to load equipment type", "error");
    }
  }, [detailQuery.error]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const saveMutation = useMutation({
    mutationFn: (formData: FormData) =>
      isEdit
        ? equipmentTypeApi.uploadUpdate(id as string, formData)
        : equipmentTypeApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentTypesQueryKey });
      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate(LIST_PATH);
    },
    onError: () => {
      Swal.fire("Error", "Unable to save equipment type.", "error");
    },
  });

  const isSubmitting = saveMutation.isPending;
  const isLoading = isEdit && detailQuery.isFetching;

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading...</div>;
  }

  const onSubmit = (values: EquipmentTypeFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("equipment_type_name", values.name);
    formData.append("category", values.category);
    formData.append("description", values.description ?? "");
    formData.append("is_active", String(values.is_active));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    saveMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="mx-auto bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit Equipment Type" : "Add Equipment Type"}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Type Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter equipment type name"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter category"
                {...register("category")}
                disabled={isSubmitting}
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Status <span className="text-red-500">*</span>
              </label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(value) => field.onChange(value === "true")}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700"
              />
              {(previewUrl || existingImage) && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="text-xs text-gray-500">Preview:</div>
                  <img
                    src={previewUrl || existingImage}
                    alt="Equipment type"
                    className="h-16 w-16 rounded border object-cover"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register("description")}
                placeholder="Add an optional description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate(LIST_PATH)}
              variant="destructive"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
