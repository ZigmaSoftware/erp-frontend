import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { Input } from "@/components/ui/input";
import { getEncryptedRoute } from "@/utils/routeCache";
import { groupPermissionApi } from "@/helpers/admin";
import type { GroupPermission } from "../types/admin.types";

const { encAdmins, encGroupPermission } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encGroupPermission}`;

const parsePermissionIds = (value: string): number[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((num) => Number.isInteger(num) && num > 0);

const toTextPermissionIds = (ids: number[] | undefined): string =>
  Array.isArray(ids) ? ids.join(", ") : "";

export default function GroupPermissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [permissionIdsText, setPermissionIdsText] = useState("");

  const parsedPermissionIds = useMemo(
    () => parsePermissionIds(permissionIdsText),
    [permissionIdsText]
  );

  useEffect(() => {
    if (!isEdit || !id) return;

    const loadRecord = async () => {
      try {
        const data = await groupPermissionApi.get(id);
        const response = (data?.data ?? data) as GroupPermission & {
          permission_ids?: number[];
        };

        setGroupId(
          response.group_id !== undefined ? String(response.group_id) : id
        );
        setGroupName(response.group_name ?? "");
        setPermissionIdsText(toTextPermissionIds(response.permission_ids));
      } catch (error) {
        console.error("Unable to load group permission", error);
        Swal.fire("Error", "Unable to load group permission record", "error");
      }
    };

    loadRecord();
  }, [id, isEdit]);

  const validate = (): boolean => {
    if (!groupId.trim() || Number.isNaN(Number(groupId))) {
      Swal.fire("Validation Error", "Valid group id is required", "error");
      return false;
    }

    if (parsedPermissionIds.length === 0) {
      Swal.fire(
        "Validation Error",
        "Provide at least one permission id (comma separated)",
        "error"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: {
      group_id: number;
      group_name?: string;
      permission_ids: number[];
    } = {
      group_id: Number(groupId),
      permission_ids: parsedPermissionIds,
    };

    if (groupName.trim()) {
      payload.group_name = groupName.trim();
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await groupPermissionApi.update(id, payload);
      } else {
        await groupPermissionApi.create(payload);
      }

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Group Permission Updated" : "Group Permission Added",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      console.error("Save failed", error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to save group permission.";
      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit Group Permission" : "Add Group Permission"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Group ID *</Label>
            <Input
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="Enter group id"
              inputMode="numeric"
            />
          </div>

          <div>
            <Label>Group Name</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Permission IDs *</Label>
            <Input
              value={permissionIdsText}
              onChange={(e) => setPermissionIdsText(e.target.value)}
              placeholder="Example: 1, 2, 3, 4, 5"
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter comma-separated permission ids.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 px-4 py-2 text-white rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom px-4 py-2 text-white rounded"
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
