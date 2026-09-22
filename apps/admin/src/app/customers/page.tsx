"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface AdminCustomer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  kycStatus: string;
  preferredLanguage: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AdminCustomer[]>("/v1/admin/customers")
      .then(setCustomers)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Customers</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<AdminCustomer>
        rows={customers}
        emptyLabel="No customers yet"
        columns={[
          { header: "Name", render: (c) => c.fullName },
          { header: "Phone", render: (c) => c.phone },
          { header: "Email", render: (c) => c.email ?? "—" },
          { header: "KYC", render: (c) => c.kycStatus },
          { header: "Language", render: (c) => c.preferredLanguage.toUpperCase() },
        ]}
      />
    </div>
  );
}
