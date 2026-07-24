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

import { salesOrderApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import type { SalesOrder, SalesOrderTransport } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encSalesOrder } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encSalesOrder}`;

  /* ---------------- Header state ---------------- */
  const [workNo, setWorkNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [orderType, setOrderType] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [description, setDescription] = useState("");

  /* ---------------- Transports ---------------- */
  const [transports, setTransports] = useState<SalesOrderTransport[]>([]);
  const [editingTransportId, setEditingTransportId] = useState<string>("");
  const [rowTransportName, setRowTransportName] = useState("");
  const [rowTransportOrderNo, setRowTransportOrderNo] = useState("");
  const [rowTransportQty, setRowTransportQty] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [siteList, customerList] = await Promise.all([
          siteApi.list(),
          customerCreationApi.list(),
        ]);
        setSites(siteList as unknown[]);
        setCustomers(customerList as unknown[]);
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

  const customerOptions = useMemo(
    () => toOptions(customers, (c) => c.unique_id, (c) => c.customer_name),
    [customers],
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await salesOrderApi.get(id as string);
        const data = (res?.data || res) as SalesOrder;

        setWorkNo(data.work_no ?? "");
        setCustomerName(data.customer_name ?? "");
        setSiteId(data.site_id ?? "");
        setEntryDate(data.entry_date ?? "");
        setOrderDate(data.order_date ?? "");
        setOrderType(data.order_type ?? "");
        setOrderNo(data.order_no ?? "");
        setDescription(data.description ?? "");
        setTransports(data.transports ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load sales order",
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
      work_no: workNo.trim(),
      customer_name: customerName,
      site_id: siteId,
      entry_date: entryDate,
      order_date: orderDate,
      order_type: orderType.trim(),
      order_no: orderNo.trim(),
      description: description.trim() || null,
    };

    try {
      if (isEdit) {
        await salesOrderApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await salesOrderApi.create(payload);
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
        error?.response?.data?.work_no?.[0] ||
        error?.response?.data?.customer_name?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save sales order.";

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
     TRANSPORT ROW HANDLERS
  ----------------------------------------------------------- */
  const resetRow = () => {
    setRowTransportName("");
    setRowTransportOrderNo("");
    setRowTransportQty("");
    setEditingTransportId("");
  };

  const handleAddRow = async () => {
    if (!rowTransportName) {
      Swal.fire({ icon: "error", title: "Transport Name is required" });
      return;
    }

    setSavingRow(true);
    try {
      const payload = {
        sales_order: id as string,
        transport_name: rowTransportName.trim(),
        transport_order_no: rowTransportOrderNo.trim(),
        transport_qty: rowTransportQty || "0",
      };

      if (editingTransportId) {
        await salesOrderApi.update(editingTransportId, payload);
      } else {
        await salesOrderApi.create(payload);
      }

      const res = await salesOrderApi.get(id as string);
      const data = (res?.data || res) as SalesOrder;
      setTransports(data.transports ?? []);
      resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: editingTransportId ? "Update failed" : "Add failed",
        text: "Something went wrong!",
      });
    } finally {
      setSavingRow(false);
    }
  };

  const handleEditRow = (item: SalesOrderTransport) => {
    setEditingTransportId(item.unique_id);
    setRowTransportName(item.transport_name);
    setRowTransportOrderNo(item.transport_order_no);
    setRowTransportQty(String(item.transport_qty ?? ""));
  };

  const handleDeleteRow = async (item: SalesOrderTransport) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This transport row will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await salesOrderApi.remove(item.unique_id);
      if (id) {
        const res = await salesOrderApi.get(id as string);
        const data = (res?.data || res) as SalesOrder;
        setTransports(data.transports ?? []);
      }
      if (editingTransportId === item.unique_id) resetRow();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Something went wrong!",
      });
    }
  };

  const isFormDisabled = fetching || loading;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Sales Order" : "Add New Sales Order"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Work No *</Label>
              <Input
                value={workNo}
                onChange={(e) => setWorkNo(e.target.value)}
                placeholder="Work No"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Customer *</Label>
              <Select
                value={customerName}
                onValueChange={setCustomerName}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Order Date *</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Order Type</Label>
              <Input
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                placeholder="Order Type"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Order No</Label>
              <Input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="Order No"
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
            <h3 className="text-lg font-semibold mb-3">Transports</h3>
            <table className="w-full border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left w-12">S.No</th>
                  <th className="border px-3 py-2 text-left">Transport Name *</th>
                  <th className="border px-3 py-2 text-left">Transport Order No</th>
                  <th className="border px-3 py-2 text-right">Qty</th>
                  <th className="border px-3 py-2 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {transports.map((item, index) => (
                  <tr key={item.unique_id}>
                    <td className="border px-3 py-2">{index + 1}</td>
                    <td className="border px-3 py-2">{item.transport_name}</td>
                    <td className="border px-3 py-2">{item.transport_order_no}</td>
                    <td className="border px-3 py-2 text-right">{item.transport_qty}</td>
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
                      value={rowTransportName}
                      onChange={(e) => setRowTransportName(e.target.value)}
                      placeholder="Transport Name"
                      disabled={isRowDisabled}
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      value={rowTransportOrderNo}
                      onChange={(e) => setRowTransportOrderNo(e.target.value)}
                      placeholder="Transport Order No"
                      disabled={isRowDisabled}
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowTransportQty}
                      onChange={(e) => setRowTransportQty(e.target.value)}
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
                        {savingRow ? "..." : editingTransportId ? "UPDATE" : "ADD"}
                      </Button>
                      {editingTransportId && (
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
