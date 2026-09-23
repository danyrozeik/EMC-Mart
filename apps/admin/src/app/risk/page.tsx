"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface RiskAlert {
  id: string;
  severity: string;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
}

export default function RiskPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminFetch<RiskAlert[]>("identity", "/v1/admin/risk-alerts")
      .then(setAlerts)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(load, []);

  async function resolve(id: string) {
    try {
      await adminFetch("identity", `/v1/admin/risk-alerts/${id}/resolve`, { method: "POST" });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <h2>Risk alerts</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<RiskAlert>
        rows={alerts}
        emptyLabel="No risk alerts"
        columns={[
          { header: "Severity", render: (a) => a.severity },
          { header: "Reason", render: (a) => a.reason },
          { header: "Opened", render: (a) => new Date(a.createdAt).toLocaleString() },
          {
            header: "Status",
            render: (a) =>
              a.resolvedAt ? (
                "Resolved"
              ) : (
                <button className="primary" onClick={() => resolve(a.id)}>
                  Resolve
                </button>
              ),
          },
        ]}
      />
    </div>
  );
}
