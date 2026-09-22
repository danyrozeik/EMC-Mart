import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RTI Admin",
  description: "Operations, merchants, transactions, KYC, risk, support and settlements for RTI",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/customers", label: "Customers" },
  { href: "/merchants", label: "Merchants" },
  { href: "/transactions", label: "Transactions" },
  { href: "/kyc", label: "KYC cases" },
  { href: "/risk", label: "Risk alerts" },
  { href: "/refunds", label: "Refunds" },
  { href: "/settlements", label: "Settlements" },
  { href: "/support", label: "Support" },
  { href: "/audit-log", label: "Audit log" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <h1>RTI Admin</h1>
            <nav>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
