"use client";

import { useEffect, useState } from "react";
import { formatEGP, money } from "@rti/shared";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface Settlement {
  id: string;
  merchantId: string;
  periodStart: string;
  periodEnd: string;
  grossAmountMinor: number;
  feeAmountMinor: number;
  netAmountMinor: number;
  status: string;
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Settlement[]>("merchants", "/v1/admin/settlements")
      .then(setSettlements)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Settlements</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<Settlement>
        rows={settlements}
        emptyLabel="No settlements yet"
        columns={[
          { header: "Merchant", render: (s) => s.merchantId },
          {
            header: "Period",
            render: (s) => `${new Date(s.periodStart).toLocaleDateString()} – ${new Date(s.periodEnd).toLocaleDateString()}`,
          },
          { header: "Gross", render: (s) => formatEGP(money(s.grossAmountMinor)) },
          { header: "Fee", render: (s) => formatEGP(money(s.feeAmountMinor)) },
          { header: "Net", render: (s) => formatEGP(money(s.netAmountMinor)) },
          { header: "Status", render: (s) => s.status },
        ]}
      />
    </div>
  );
}
