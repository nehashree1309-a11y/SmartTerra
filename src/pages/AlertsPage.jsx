const alerts = [
  { type: 'Someone searched your parcel', channel: 'SMS', time: '08 min ago', severity: 'warn' },
  { type: 'A transfer was requested', channel: 'WhatsApp', time: '19 min ago', severity: 'alert' },
  { type: 'Objection filed', channel: 'Email', time: '42 min ago', severity: 'danger' },
  { type: 'Tax due soon', channel: 'Portal', time: '1 day ago', severity: 'info' },
]

function AlertsPage() {
  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">Alerts & protection</span>
          <h1>Notification center</h1>
        </div>
        <button type="button" className="primary-button small">Parcel lock</button>
      </div>

      <div className="alert-list glass-panel">
        {alerts.map((alert, index) => (
          <div key={index} className="alert-item">
            <div className={`alert-dot ${alert.severity}`}></div>
            <div className="alert-copy">
              <strong>{alert.type}</strong>
              <span>{alert.channel} · {alert.time}</span>
            </div>
            <button type="button" className="secondary-button small">This wasn’t me</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlertsPage
