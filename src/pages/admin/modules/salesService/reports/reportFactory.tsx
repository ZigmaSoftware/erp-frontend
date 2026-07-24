import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/api";
import { salesReportEndpoints } from "@/helpers/admin";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

type ReportConfig = {
  title: string;
  endpoint: string;
  columns: { field: string; header: string }[];
  filters?: { label: string; key: string; type?: string }[];
};

export function createReportPage(config: ReportConfig) {
  return function ReportPage() {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
        const { data: res } = await api.get(config.endpoint, { params });
        setData(res?.results || []);
      } catch { /* empty */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filterFields = config.filters || [
      { label: "From Date", key: "from_date", type: "date" },
      { label: "To Date", key: "to_date", type: "date" },
    ];

    return (
      <Card>
        <CardHeader><CardTitle>{config.title}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4 items-end flex-wrap">
            {filterFields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                <InputText
                  type={f.type || "text"}
                  value={filters[f.key] || ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.label}
                />
              </div>
            ))}
            <Button label="Search" icon="pi pi-search" onClick={fetchData} loading={loading} />
          </div>
          <DataTable value={data} loading={loading} stripedRows paginator rows={20}>
            {config.columns.map((col) => (
              <Column key={col.field} field={col.field} header={col.header} />
            ))}
          </DataTable>
        </CardContent>
      </Card>
    );
  };
}
