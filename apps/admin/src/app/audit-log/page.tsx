"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface AuditLogEntry {
  id: string;
  actorType: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AuditLogEntry[]>("identity", "/v1/admin/audit-logs")
      .then(setEntries)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Audit log</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<AuditLogEntry>
        rows={entries}
        emptyLabel="No audit events yet"
        columns={[
          { header: "Action", render: (e) => e.action },
          { header: "Actor", render: (e) => `${e.actorType} · ${e.actorId}` },
          { header: "Target", render: (e) => `${e.targetType} · ${e.targetId}` },
          { header: "When", render: (e) => new Date(e.createdAt).toLocaleString() },
        ]}
      />
    </div>
  );
}
