export default function SupportPage() {
  return (
    <div>
      <h2>Support</h2>
      <div className="card">
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Support ticketing is an unresolved integration boundary for this MVP — this screen is the
          placeholder where a helpdesk provider (e.g. Zendesk, Freshdesk) or an in-house ticket queue would
          be wired in via <code>GET /v1/admin/support/tickets</code>.
        </p>
      </div>
    </div>
  );
}
