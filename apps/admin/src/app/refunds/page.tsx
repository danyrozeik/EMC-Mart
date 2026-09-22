"use client";

import { useEffect, useState } from "react";
import { formatEGP, money } from "@rti/shared";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface RefundRequest {
  id: string;
  transactionId: string;
  amountMinor: number;
  reason: string | null;
  status: string;
  createdAt: string;
}

export default function RefundsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminFetch<RefundRequest[]>("/v1/admin/refund-requests")
      .then(setRequests)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(load, []);

  async function approve(id: string) {
    try {
      await adminFetch(`/v1/admin/refund-requests/${id}/approve`, {
        method: "POST",
        headers: { "Idempotency-Key": `admin-refund-${id}` },
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function reject(id: string) {
    try {
      await adminFetch(`/v1/admin/refund-requests/${id}/reject`, { method: "POST" });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <h2>Refund requests</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<RefundRequest>
        rows={requests}
        emptyLabel="No pending refund requests"
        columns={[
          { header: "Transaction", render: (r) => r.transactionId },
          { header: "Amount", render: (r) => formatEGP(money(r.amountMinor)) },
          { header: "Reason", render: (r) => r.reason ?? "—" },
          { header: "Requested", render: (r) => new Date(r.createdAt).toLocaleString() },
          {
            header: "Decision",
            render: (r) => (
              <span>
                <button className="primary" onClick={() => approve(r.id)} style={{ marginRight: 8 }}>
                  Approve
                </button>
                <button className="danger" onClick={() => reject(r.id)}>
                  Reject
                </button>
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
