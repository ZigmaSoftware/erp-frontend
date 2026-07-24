import { useEffect, useMemo, useState, type FormEvent } from "react";
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

import { workOrderApi, siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import type { WorkOrder, WorkOrderSub } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function WorkOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encWorkOrder } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encWorkOrder}`;

  /* ---------------- Header state ---------------- */
  const [supplierName, setSupplierName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [plantName, setPlantName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [workType, setWorkType] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [compPeriod, setCompPeriod] = useState("");
  const [tds, setTds] = useState("0");
  const [packageForward, setPackageForward] = useState("0");
  const [transportCost, setTransportCost] = useState("0");
  const [freightCharge, setFreightCharge] = useState("0");
  const [budgetNo, setBudgetNo] = useState("");

  /* ---------------- Sub-items ---------------- */
  const [items, setItems] = useState<WorkOrderSub[]>([]);
  const [editingItemId, setEditingItemId] = useState<string>("");
  const [rowItemName, setRowItemName] = useState("");
  const [rowQty, setRowQty] = useState("");
  const [rowRate, setRowRate] = useState("");
  const [rowAmount, setRowAmount] = useState("");
  const [rowTax, setRowTax] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [siteList] = await Promise.all([siteApi.list()]);
        setSites(siteList as unknown[]);
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

  const siteOptions = useMemo(
    () => toOptions(sites, (s) => s.unique_id, (s) => s.site_name),
    [sites],
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await workOrderApi.get(id as string);
        const data = (res?.data || res) as WorkOrder;

        setSupplierName(data.suppliername ?? "");
        setSiteId(data.site_id ?? "");
        setPlantName(data.plant_name ?? "");
        setDepartmentName(data.department_name ?? "");
        setDescription(data.description ?? "");
        setEntryDate(data.entry_date ?? "");
        setWorkType(data.work_type ?? "");
        setPaymentTerms(data.payment_terms ?? "");
        setCompPeriod(data.comp_period ?? "");
        setTds(String(data.tds ?? "0"));
        setPackageForward(String(data.package_forward ?? "0"));
        setTransportCost(String(data.transport_cost ?? "0"));
        setFreightCharge(String(data.freight_charge ?? "0"));
        setBudgetNo(data.budget_no ?? "");
        setItems(data.sub_items ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load work order",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     SUBMIT HANDLER
  ----------------------------------------------------------- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      suppliername: supplierName.trim(),
      site_id: siteId,
      plant_name: plantName.trim() || null,
      department_name: departmentName.trim() || null,
      description: description.trim() || null,
      entry_date: entryDate,
      work_type: workType.trim() || null,
      payment_terms: paymentTerms.trim() || null,
      comp_period: compPeriod.trim() || null,
      tds: tds || "0",
      package_forward: packageForward || "0",
      transport_cost: transportCost || "0",
      freight_charge: freightCharge || "0",
      budget_no: budgetNo.trim() || null,
    };

    try {
      if (isEdit) {
        await workOrderApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await workOrderApi.create(payload);
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
        error?.response?.data?.suppliername?.[0] ||
        error?.response?.data?.site_id?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save work order.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------
     SUB-ITEM ROW HANDLERS
  ----------------------------------------------------------- */
  const resetRow = () => {
    setRowItemName("");
    setRowQty("");
    setRowRate("");
    setRowAmount("");
    setRowTax("");
    setEditingItemId("");
  };

  const handleAddRow = async () => {
    if (!rowItemName) {
      Swal.fire({ icon: "error", title: "Item Name is required" });
      return;
    }

    setSavingRow(true);
    try {
      const payload = {
        work_order: id as string,
        itemname: rowItemName.trim(),
        qty: rowQty || "0",
        rate: rowRate || "0",
        amount: rowAmount || "0",
        tax_per: rowTax || "0",
      };

      if (editingItemId) {
        await workOrderApi.update(editingItemId, payload);
      } else {
        await workOrderApi.create(payload);
      }

      const res = await workOrderApi.get(id as string);
      const data = (res?.data || res) as WorkOrder;
      setItems(data.sub_items ?? []);
      resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: editingItemId ? "Update failed" : "Add failed",
        text: "Something went wrong!",
      });
    } finally {
      setSavingRow(false);
    }
  };

  const handleEditRow = (item: WorkOrderSub) => {
    setEditingItemId(item.unique_id);
    setRowItemName(item.itemname);
    setRowQty(String(item.qty ?? ""));
    setRowRate(String(item.rate ?? ""));
    setRowAmount(String(item.amount ?? ""));
    setRowTax(String(item.tax_per ?? ""));
  };

  const handleDeleteRow = async (item: WorkOrderSub) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This row will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await workOrderApi.remove(item.unique_id);
      if (id) {
        const res = await workOrderApi.get(id as string);
        const data = (res?.data || res) as WorkOrder;
        setItems(data.sub_items ?? []);
      }
      if (editingItemId === item.unique_id) resetRow();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Something went wrong!",
      });
    }
  };

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          qty: acc.qty + toNumber(item.qty),
          amount: acc.amount + toNumber(item.amount),
        }),
        { qty: 0, amount: 0 },
      ),
    [items],
  );

  const isFormDisabled = fetching || loading;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Work Order" : "Add New Work Order"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Supplier Name *</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier Name"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Site *</Label>
              <Select
                value={siteId}
                onValueChange={setSiteId}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
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
              <Label>Plant Name</Label>
              <Input
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                placeholder="Plant Name"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Department</Label>
              <Input
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Department"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Entry Date *</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Work Type</Label>
              <Input
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                placeholder="Work Type"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Payment Terms</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Payment Terms"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Comp Period</Label>
              <Input
                value={compPeriod}
                onChange={(e) => setCompPeriod(e.target.value)}
                placeholder="Completion Period"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>TDS</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tds}
                onChange={(e) => setTds(e.target.value)}
                placeholder="TDS"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Package Forward</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={packageForward}
                onChange={(e) => setPackageForward(e.target.value)}
                placeholder="Package Forward"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Transport Cost</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={transportCost}
                onChange={(e) => setTransportCost(e.target.value)}
                placeholder="Transport Cost"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Freight Charge</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={freightCharge}
                onChange={(e) => setFreightCharge(e.target.value)}
                placeholder="Freight Charge"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Budget No</Label>
              <Input
                value={budgetNo}
                onChange={(e) => setBudgetNo(e.target.value)}
                placeholder="Budget No"
                disabled={isFormDisabled}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                disabled={isFormDisabled}
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left w-12">S.No</th>
                  <th className="border px-3 py-2 text-left">Item Name *</th>
                  <th className="border px-3 py-2 text-right">Qty</th>
                  <th className="border px-3 py-2 text-right">Rate</th>
                  <th className="border px-3 py-2 text-right">Amount</th>
                  <th className="border px-3 py-2 text-right">Tax (%)</th>
                  <th className="border px-3 py-2 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.unique_id}>
                    <td className="border px-3 py-2">{index + 1}</td>
                    <td className="border px-3 py-2">{item.itemname}</td>
                    <td className="border px-3 py-2 text-right">{item.qty}</td>
                    <td className="border px-3 py-2 text-right">{item.rate}</td>
                    <td className="border px-3 py-2 text-right">{item.amount}</td>
                    <td className="border px-3 py-2 text-right">{item.tax_per}</td>
                    <td className="border px-3 py-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          title="Edit"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEditRow(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteRow(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td className="border px-3 py-2">#</td>
                  <td className="border px-3 py-2">
                    <Input
                      value={rowItemName}
                      onChange={(e) => setRowItemName(e.target.value)}
                      placeholder="Item Name"
                      disabled={isRowDisabled}
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowQty}
                      onChange={(e) => setRowQty(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowRate}
                      onChange={(e) => setRowRate(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowAmount}
                      onChange={(e) => setRowAmount(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowTax}
                      onChange={(e) => setRowTax(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        onClick={handleAddRow}
                        disabled={isRowDisabled}
                        className="h-8 px-3"
                      >
                        {savingRow ? "..." : editingItemId ? "UPDATE" : "ADD"}
                      </Button>
                      {editingItemId && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={resetRow}
                          disabled={isRowDisabled}
                          className="h-8 px-3"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-semibold bg-gray-50">
                  <td className="border px-3 py-2" colSpan={2}>
                    Total
                  </td>
                  <td className="border px-3 py-2 text-right">{totals.qty}</td>
                  <td className="border px-3 py-2" />
                  <td className="border px-3 py-2 text-right">{totals.amount}</td>
                  <td className="border px-3 py-2" />
                  <td className="border px-3 py-2" />
                </tr>
              </tfoot>
            </table>
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
