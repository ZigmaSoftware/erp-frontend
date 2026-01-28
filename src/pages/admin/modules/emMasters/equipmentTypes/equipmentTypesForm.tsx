import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { Input } from "@/components/ui/input";
import { getEncryptedRoute } from "@/utils/routeCache";
import { equipmentTypeApi } from "@/helpers/admin";

const { encEmMasters, encEquipmentType } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encEmMasters}/${encEquipmentType}`;

export default function EquipmentTypeForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const equipmentTypeId = id;
  const isEdit = Boolean(equipmentTypeId);

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      try {
        const res = await equipmentTypeApi.get(equipmentTypeId as string);
        const data = (res as any)?.data ?? res;

        setName(
          data?.name ??
          data?.equipment_type_name ??
          data?.equipmenttype_name ??
          ""
        );
        setDescription(data?.description ?? data?.remarks ?? "");
        setCategory(data?.category ?? data?.category_name ?? "");
        setExistingImage(data?.image ?? data?.image_url ?? "");

        const status = data?.is_active;
        const derivedStatus =
          status !== undefined && status !== null
            ? Boolean(status)
            : typeof data?.status === "boolean"
              ? data?.status
              : String(data?.status ?? "").toLowerCase() === "active";

        setIsActive(derivedStatus);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load equipment type",
          text: "Something went wrong!",
        });
      }
    };

    loadData();
  }, [isEdit, equipmentTypeId]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = new FormData();
    payload.append("name", name);
    payload.append("equipment_type_name", name);
    payload.append("description", description);
    payload.append("category", category);
    payload.append("is_active", String(isActive));
    if (imageFile) {
      payload.append("image", imageFile);
    }

    try {
      if (isEdit) {
        await equipmentTypeApi.uploadUpdate(equipmentTypeId as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await equipmentTypeApi.upload(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.equipment_type_name?.[0] ||
        error?.response?.data?.category?.[0] ||
        error?.response?.data?.image?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save equipment type.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mx-auto bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit Equipment Type" : "Add Equipment Type"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Type Name <span className="text-red-500">*</span>
              </label>

              <Input
                type="text"
                placeholder="Enter equipment type name"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>

              <Input
                type="text"
                placeholder="Enter category"
                value={category}
                required
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Status <span className="text-red-500">*</span>
              </label>

              <select
                value={isActive ? "Active" : "Inactive"}
                onChange={(e) => setIsActive(e.target.value === "Active")}
                className="w-full px-3 py-2 border border-green-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              {(existingImage || imageFile) && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="text-xs text-gray-500">Preview:</div>
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : existingImage}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add an optional description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white font-medium px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => navigate(ENC_LIST_PATH)}
              className="bg-red-500 text-white font-medium px-6 py-2 rounded hover:bg-red-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
