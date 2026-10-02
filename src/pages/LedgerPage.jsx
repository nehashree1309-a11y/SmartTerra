function LedgerPage() {
  const ledgerEntries = [
    { action: 'Document verified', actor: 'AI Scanner', hash: '0x9af1', stamp: '09:12 AM' },
    { action: 'Field check approved', actor: 'Surveyor', hash: '0xb5c7', stamp: '11:40 AM' },
    { action: 'Mutation approved', actor: 'Officer', hash: '0x1ea8', stamp: '02:05 PM' },
    { action: 'Owner notified', actor: 'Citizen portal', hash: '0x2af0', stamp: '03:12 PM' },
  ]

  return (
    <div className="content-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">SmartTerra ledger</span>
          <h1>Tamper-proof audit trail</h1>
        </div>
        <button type="button" className="primary-button small">Verify chain integrity</button>
      </div>

      <div className="ledger-grid glass-panel">
        {ledgerEntries.map((entry, index) => (
          <div key={index} className="ledger-row">
            <div className="ledger-block">
              <span className="ledger-hash">{entry.hash}</span>
              <strong>{entry.action}</strong>
            </div>
            <div className="ledger-meta">
              <span>{entry.actor}</span>
              <small>{entry.stamp}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LedgerPage
