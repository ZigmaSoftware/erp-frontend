import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { itemGroupCreationApi, itemTypeApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import { normalizeRelationId } from "@/utils/formHelpers";
import type { ItemGroupCreation, ItemType } from "../types/salesMasters.types";

export default function ItemGroupCreationForm() {
  const [itemType, setItemType] = useState("");
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemId, setItemId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesMasters, encItemGroupCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesMasters}/${encItemGroupCreation}`;

  useEffect(() => {
    const loadItemTypes = async () => {
      try {
        const res = await itemTypeApi.list();
        const activeTypes = (res as ItemType[]).filter(
          (type) => type.is_active !== false,
        );
        setItemTypes(activeTypes);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load item types",
          text: "Something went wrong!",
        });
      }
    };

    loadItemTypes();
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await itemGroupCreationApi.get(id as string);
        const data = (res?.data || res) as ItemGroupCreation;

        setItemType(normalizeRelationId(data.item_type));
        setSubCategoryName(data.sub_category_name ?? "");
        setItemName(data.item_name ?? "");
        setItemId(data.item_id ?? "");
        setIsActive(data.is_active ?? true);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load item group",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      item_type: itemType,
      sub_category_name: subCategoryName.trim(),
      item_name: itemName.trim(),
      item_id: itemId.trim() || null,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await itemGroupCreationApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await itemGroupCreationApi.create(payload);
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

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Item Group" : "Add New"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Item Type *</Label>
              <Select
                value={itemType || undefined}
                onValueChange={(value) => setItemType(value)}
                disabled={isFormDisabled}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((type) => (
                    <SelectItem key={type.unique_id} value={type.unique_id}>
                      {type.item_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sub Category Name *</Label>
              <Input
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
                placeholder="Sub Category Name"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Item Name *</Label>
              <Textarea
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item Name"
                rows={3}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Item ID</Label>
              <Input
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder="Item ID"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Active Status *</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(value) => setIsActive(value === "true")}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
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
      </ComponentCard>
    </div>
  );
}
