export default function OverviewPage() {
  return (
    <div>
      <h2>Overview</h2>
      <p style={{ color: "var(--muted)" }}>
        Operations console for the RTI super-app. Use the sidebar to review customers, merchants,
        transactions, KYC cases, risk alerts, refunds, settlements and the audit log.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <strong>Getting started</strong>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Sign in at <a href="/login">/login</a> with an admin account (seeded: admin@rti.example /
          Passw0rd!) to load live data from the RTI API.
        </p>
      </div>
    </div>
  );
}
