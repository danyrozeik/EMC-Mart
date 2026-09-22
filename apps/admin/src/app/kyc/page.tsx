"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface KycCase {
  id: string;
  subjectType: string;
  subjectId: string;
  status: string;
  createdAt: string;
}

export default function KycPage() {
  const [cases, setCases] = useState<KycCase[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminFetch<KycCase[]>("/v1/admin/kyc-cases")
      .then(setCases)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(load, []);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    try {
      await adminFetch(`/v1/admin/kyc-cases/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <h2>KYC cases</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<KycCase>
        rows={cases}
        emptyLabel="No KYC cases pending"
        columns={[
          { header: "Subject", render: (c) => `${c.subjectType} · ${c.subjectId}` },
          { header: "Status", render: (c) => c.status },
          { header: "Opened", render: (c) => new Date(c.createdAt).toLocaleString() },
          {
            header: "Decision",
            render: (c) =>
              c.status === "PENDING_REVIEW" ? (
                <span>
                  <button className="primary" onClick={() => decide(c.id, "APPROVED")} style={{ marginRight: 8 }}>
                    Approve
                  </button>
                  <button className="danger" onClick={() => decide(c.id, "REJECTED")}>
                    Reject
                  </button>
                </span>
              ) : (
                "—"
              ),
          },
        ]}
      />
    </div>
  );
}
