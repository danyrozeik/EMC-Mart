"use client";

import { useEffect, useState } from "react";
import { formatEGP, money } from "@rti/shared";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface AdminTransaction {
  id: string;
  type: string;
  status: string;
  amountMinor: number;
  reference: string;
  customerId: string;
  merchantId: string | null;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AdminTransaction[]>("/v1/admin/transactions")
      .then(setTransactions)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Transactions</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<AdminTransaction>
        rows={transactions}
        emptyLabel="No transactions yet"
        columns={[
          { header: "Reference", render: (t) => t.reference },
          { header: "Type", render: (t) => t.type },
          { header: "Amount", render: (t) => formatEGP(money(t.amountMinor)) },
          { header: "Status", render: (t) => t.status },
          { header: "Date", render: (t) => new Date(t.createdAt).toLocaleString() },
        ]}
      />
    </div>
  );
}
