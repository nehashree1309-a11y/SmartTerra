import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mockParcels } from '../data/mockParcels'
import { getCertificatesForParcel, getOwnershipHistory, getParcel, mapParcelToView } from '../lib/api'

function ParcelPage() {
  const { id } = useParams()
  const [parcel, setParcel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadedId, setLoadedId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadParcel = async () => {
      const fallback = mockParcels.find((item) =>
        [item.id, item.surveyNumber.replace(/\//g, '-')].some((value) => value.toLowerCase() === id.toLowerCase()),
      )
      try {
        const record = await getParcel(id)
        if (!record) {
          if (active) {
            setParcel(fallback ?? null)
            setError(fallback ? 'Showing demo data; this parcel is not in Supabase yet.' : 'Parcel not found.')
            setLoadedId(id)
          }
          return
        }
        const [history, certificates] = await Promise.all([
          getOwnershipHistory(record.id),
          getCertificatesForParcel(record.id),
        ])
        if (active) {
          setParcel(mapParcelToView(record, history, certificates))
          setError('')
          setLoadedId(id)
        }
      } catch (cause) {
        if (active) {
          setParcel(fallback ?? null)
          setError(fallback
            ? `Showing offline demo data: ${cause.message || 'Supabase is unavailable.'}`
            : cause.message || 'Could not load this parcel.')
          setLoadedId(id)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadParcel()
    return () => { active = false }
  }, [id])

  if (loading || loadedId !== id) return <div className="content-page"><p role="status">Loading parcel...</p></div>
  if (!parcel) return <div className="content-page"><p className="form-error" role="alert">{error || 'Parcel not found.'}</p></div>

  return (
    <div className="content-page">
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">Land Passport</span>
          <h1>{parcel.surveyNumber}</h1>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button small">Share</button>
          <button type="button" className="secondary-button small">Download Certificate</button>
          <button type="button" className="primary-button small">Set Alert</button>
        </div>
      </div>

      <div className="parcel-overview glass-panel">
        <div className="parcel-summary-grid">
          <div><span>Village</span><strong>{parcel.village}</strong></div>
          <div><span>Taluk</span><strong>{parcel.taluk}</strong></div>
          <div><span>District</span><strong>{parcel.district}</strong></div>
          <div><span>Area</span><strong>{parcel.area}</strong></div>
          <div><span>Land type</span><strong>{parcel.landType}</strong></div>
          <div><span>Owner</span><strong>{parcel.owner}</strong></div>
          <div><span>Status</span><strong className="status-inline">{parcel.status}</strong></div>
          <div><span>Trust Level</span><strong>{parcel.trust}</strong></div>
          <div><span>Certificate</span><strong>{parcel.certificateId || 'Not issued'}</strong></div>
        </div>
      </div>

      <div className="parcel-layout">
        <div className="map-panel glass-panel">
          <div className="map-toolbar">
            <div className="map-layers">
              {['Street', 'Satellite', 'Survey'].map((layer) => (
                <button key={layer} type="button" className={layer === 'Survey' ? 'map-layer active' : 'map-layer'}>
                  {layer}
                </button>
              ))}
            </div>
            <div className="map-tools">
              <button type="button">Measure</button>
              <button type="button">Fit bounds</button>
            </div>
          </div>
          <div className="map-canvas compact-map" aria-label="Parcel map">
            <div className="grid-overlay"></div>
            <div className="parcel-boundary parcel-fill"></div>
            <div className="neighbor parcel-neighbor-a"></div>
            <div className="neighbor parcel-neighbor-b"></div>
            <div className="conflict-zone"></div>
            <div className="map-pin"></div>
          </div>
        </div>

        <aside className="facts-panel glass-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow gold">Fraud risk</span>
              <h3>Risk score</h3>
            </div>
          </div>
          <div className="risk-box single">
            <div className="risk-gauge" style={{ background: 'conic-gradient(#1fa96c 0 60%, #d8b45a 60% 82%, #d64a4a 82% 100%)' }}>
              <div className="gauge-inner">
                <strong>{parcel.riskScore}</strong>
                <span>Risk</span>
              </div>
            </div>
            <div className="risk-summary">
              <p>Two transfers in 30 days, boundary overlaps survey 214/3, and area mismatch detected.</p>
            </div>
          </div>

          <div className="history-card compact">
            <div className="history-head">
              <span className="transfer-tag sale">Mutation</span>
              <strong>2024</strong>
            </div>
            <h4>{parcel.transferHistory.at(-1)?.owner ?? parcel.owner}</h4>
            <p>{parcel.transferHistory.length
              ? `${parcel.transferHistory.length} ownership records loaded from the land registry.`
              : 'No ownership history recorded.'}</p>
          </div>
        </aside>
      </div>

      <div className="tabbed-section glass-panel">
        <div className="tab-buttons">
          {['Documents', 'Encumbrances & Disputes', 'Tax', 'Activity'].map((tab) => (
            <button key={tab} type="button" className={tab === 'Documents' ? 'tab-button active' : 'tab-button'}>
              {tab}
            </button>
          ))}
        </div>

        <div className="document-list">
          {parcel.documents.map((document) => (
            <div key={document.name} className="doc-item">
              <div className="doc-thumb"><span>{document.type}</span></div>
              <div className="doc-copy">
                <strong>{document.name}</strong>
                <span>{document.meta}</span>
              </div>
              <button type="button" className={document.status === 'Verified' ? 'doc-pill ok' : 'doc-pill warn'}>
                {document.status === 'Verified' ? 'Verified' : 'Needs review'}
              </button>
            </div>
          ))}
          {parcel.documents.length === 0 && <p>No documents linked to this parcel yet.</p>}
        </div>
      </div>

      <div className="links-row">
        <Link to="/verify" className="secondary-button small">Verify document</Link>
        <Link to="/alerts" className="secondary-button small">View alerts</Link>
      </div>
    </div>
  )
}

export default ParcelPage
