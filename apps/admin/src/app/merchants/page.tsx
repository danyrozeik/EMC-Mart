"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "../../lib/api-client";
import { DataTable } from "../../components/DataTable";

interface AdminMerchant {
  id: string;
  businessName: string;
  category: string;
  kycStatus: string;
  createdAt: string;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AdminMerchant[]>("merchants", "/v1/admin/merchants")
      .then(setMerchants)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Merchants</h2>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable<AdminMerchant>
        rows={merchants}
        emptyLabel="No merchants yet"
        columns={[
          { header: "Business", render: (m) => m.businessName },
          { header: "Category", render: (m) => m.category },
          { header: "KYC", render: (m) => m.kycStatus },
          { header: "Onboarded", render: (m) => new Date(m.createdAt).toLocaleDateString() },
        ]}
      />
    </div>
  );
}
