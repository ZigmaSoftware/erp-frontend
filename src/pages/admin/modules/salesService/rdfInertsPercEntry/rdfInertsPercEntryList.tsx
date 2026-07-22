import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Eye } from "lucide-react";

import { DataTable } from "primereact/datatable";
import type { DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button as PrimeButton } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
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
import { rdfInertsPercEntryServiceApi, siteApi } from "@/helpers/admin";
import type {
  RdfInertsPercEntry,
  RdfInertsPercEntrySub,
} from "../types/salesService.types";

type SiteOption = {
  unique_id: string;
  site_name: string;
  is_active?: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (date: string) => {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}-${month}-${year}` : date;
};

export default function RdfInertsPercEntryList() {
  const [entries, setEntries] = useState<RdfInertsPercEntry[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [siteFilter, setSiteFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: "",
    toDate: "",
    site: "all",
  });
  const [viewEntry, setViewEntry] = useState<RdfInertsPercEntry | null>(null);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ri_perc_entry_no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encRdfInertsPercEntry } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encRdfInertsPercEntry}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encRdfInertsPercEntry}/${unique_id}/edit`;

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = (await rdfInertsPercEntryServiceApi.list()) as RdfInertsPercEntry[];
      setEntries(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [entryList, siteList] = await Promise.all([
          rdfInertsPercEntryServiceApi.list(),
          siteApi.list(),
        ]);
        setEntries(entryList as RdfInertsPercEntry[]);
        setSites(
          (siteList as SiteOption[]).filter((site) => site.is_active !== false),
        );
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = entry.perc_date;
      const matchesDate =
        (!appliedFilters.fromDate || entryDate >= appliedFilters.fromDate) &&
        (!appliedFilters.toDate || entryDate <= appliedFilters.toDate);
      const selectedSite = sites.find((site) => site.unique_id === appliedFilters.site);
      const entrySiteName = entry.site_display_name || entry.site_name;
      const matchesSite =
        appliedFilters.site === "all" ||
        entry.site_id === appliedFilters.site ||
        entrySiteName === selectedSite?.site_name;
      return matchesDate && matchesSite;
    });
  }, [entries, appliedFilters, sites]);

  const handleDelete = async (uniqueId: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This RDF & Inerts percentage entry will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await rdfInertsPercEntryServiceApi.remove(uniqueId);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchEntries();
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: RdfInertsPercEntry, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const statusTemplate = (row: RdfInertsPercEntry) =>
    row.perc_status ? "Active" : "Inactive";

  const viewTemplate = (row: RdfInertsPercEntry) => (
    <div className="flex justify-center">
      <button
        title="View item list"
        className="text-gray-700 hover:text-emerald-700"
        onClick={() => setViewEntry(row)}
      >
        <Eye className="size-5" />
      </button>
    </div>
  );

  const actionTemplate = (row: RdfInertsPercEntry) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.unique_id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search entries..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const viewRows = viewEntry?.items ?? [];

  return (
    <div className="px-3 py-3 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            RDF & Inerts Percentage Entry
          </h1>
          <p className="text-gray-500 text-sm">
            Manage RDF and Inerts percentage records
          </p>
        </div>

        <PrimeButton
          label="Add New"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr_auto] gap-4 mb-5 items-end">
        <div>
          <Label>From Date</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <Label>To Date</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div>
          <Label>Site Name</Label>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.unique_id} value={site.unique_id}>
                  {site.site_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          onClick={() =>
            setAppliedFilters({ fromDate, toDate, site: siteFilter })
          }
        >
          GO
        </Button>
      </div>

      <DataTable
        value={filteredEntries}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={[
          "ri_perc_entry_no",
          "site_display_name",
          "perc_item_name",
          "created_by",
        ]}
        header={header}
        emptyMessage="No RDF & Inerts percentage entries found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="#" body={indexTemplate} style={{ width: "80px" }} />
        <Column
          field="perc_date"
          header="Date"
          body={(row: RdfInertsPercEntry) => formatDate(row.perc_date)}
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          field="ri_perc_entry_no"
          header="Entry No"
          sortable
          style={{ minWidth: "220px" }}
        />
        <Column
          field="site_display_name"
          header="Site Name"
          sortable
          style={{ minWidth: "240px" }}
        />
        <Column
          field="created_by"
          header="Add User"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "140px" }}
        />
        <Column header="View" body={viewTemplate} style={{ width: "110px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "140px" }} />
      </DataTable>

      <Dialog
        header={viewEntry?.ri_perc_entry_no ?? "RDF & Inerts % Form"}
        visible={Boolean(viewEntry)}
        style={{ width: "70vw", maxWidth: "900px" }}
        modal
        onHide={() => setViewEntry(null)}
      >
        <DataTable
          value={viewRows}
          emptyMessage="No item rows found."
          showGridlines
          stripedRows
          className="p-datatable-sm"
        >
          <Column
            header="S.No"
            body={(_: RdfInertsPercEntrySub, { rowIndex }: { rowIndex: number }) =>
              rowIndex + 1
            }
            style={{ width: "80px" }}
          />
          <Column
            field="perc_date"
            header="Date"
            body={(row: RdfInertsPercEntrySub) => formatDate(row.perc_date)}
          />
          <Column field="perc_item_name" header="Item Type" />
          <Column field="perc_item_percentage" header="Percentage" />
          <Column
            header="Status"
            body={(row: RdfInertsPercEntrySub) =>
              row.perc_status ? "Active" : "Inactive"
            }
          />
        </DataTable>
      </Dialog>
    </div>
  );
}
