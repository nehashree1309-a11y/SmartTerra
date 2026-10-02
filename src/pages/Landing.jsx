import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockParcels } from '../data/mockParcels'
import { getCertificatesForParcel, getOwnershipHistory, getParcel, mapParcelToView, searchParcels } from '../lib/api'

const statCards = [
  { value: '2.4L+', label: 'Parcels digitized' },
  { value: '94.3%', label: 'Documents verified' },
  { value: '12.7K', label: 'Fraud attempts flagged' },
]

const searchFilters = ['Survey No.', 'Owner', 'Village', 'Document ID']
const trustSignals = ['Tamper-proof ledger', 'QR verified', 'AI-checked', 'Tamil & English']

const howItWorks = [
  { step: '01', title: 'Search a parcel', text: 'Locate a survey number or owner record using smart matching and voice search.' },
  { step: '02', title: 'Verify details', text: 'Cross-check records, deeds, tax history, and boundary markers in seconds.' },
  { step: '03', title: 'Secure transfer', text: 'Approve mutation or alert disputes with an auditable public ledger trail.' },
]

const documentTabs = ['Documents', 'Encumbrances & Disputes', 'Tax', 'Activity']

function LandingPage() {
  const navigate = useNavigate()
  const [searchFilter, setSearchFilter] = useState(searchFilters[0])
  const [searchInput, setSearchInput] = useState('123-4A')
  const [activeTab, setActiveTab] = useState('Documents')
  const [selectedYear, setSelectedYear] = useState(2018)
  const [selectedParcel, setSelectedParcel] = useState(mockParcels[0])
  const [parcelLoading, setParcelLoading] = useState(true)
  const [parcelError, setParcelError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    let active = true
    const loadFeaturedParcel = async () => {
      try {
        const parcel = await getParcel('123/4A')
        if (!parcel) throw new Error('No parcel record was found.')
        const [history, certificates] = await Promise.all([
          getOwnershipHistory(parcel.id),
          getCertificatesForParcel(parcel.id),
        ])
        if (!active) return
        const view = mapParcelToView(parcel, history, certificates)
        setSelectedParcel(view)
        if (view.transferHistory.length) setSelectedYear(view.transferHistory[0].year)
      } catch (cause) {
        if (active) setParcelError(`Showing offline demo data: ${cause.message || 'Supabase is unavailable.'}`)
      } finally {
        if (active) setParcelLoading(false)
      }
    }
    void loadFeaturedParcel()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const query = searchInput.trim().replace(/-/g, '/')
    if (!query) return undefined

    let active = true
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true)
      setSearchError('')
      try {
        const matches = await searchParcels(query)
        if (active) setSuggestions(matches)
      } catch (cause) {
        if (!active) return
        const offlineMatches = mockParcels.filter((parcel) =>
          `${parcel.surveyNumber} ${parcel.owner} ${parcel.village}`.toLowerCase().includes(query.toLowerCase()),
        )
        setSuggestions(offlineMatches.map((parcel) => ({
          survey_no: parcel.surveyNumber,
          village: parcel.village,
          owner_name: parcel.owner,
          offline: true,
        })))
        setSearchError(`Offline search: ${cause.message || 'Supabase is unavailable.'}`)
      } finally {
        if (active) setSuggestionsLoading(false)
      }
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [searchInput])

  const activeHistory = useMemo(
    () => selectedParcel.transferHistory.find((entry) => entry.year === selectedYear) ?? selectedParcel.transferHistory[0] ?? null,
    [selectedParcel, selectedYear],
  )

  const handleSearch = async (match = null) => {
    setSearchError('')
    try {
      const results = match ? [match] : await searchParcels(searchInput.trim().replace(/-/g, '/'))
      if (!results.length) {
        setSearchError('No matching parcel found.')
        return
      }
      const surveyNumber = results[0].survey_no
      navigate(`/parcel/${surveyNumber.replace(/\//g, '-')}`)
    } catch (cause) {
      const normalized = searchInput.trim().replace(/-/g, '/').toLowerCase()
      const fallback = mockParcels.find((parcel) => parcel.surveyNumber.toLowerCase() === normalized)
      if (fallback) navigate(`/parcel/${fallback.id}`)
      else setSearchError(cause.message || 'Parcel search failed.')
    }
  }

  return (
    <>
      {parcelLoading && <p role="status">Loading parcel data...</p>}
      {parcelError && <p className="form-error" role="alert">{parcelError}</p>}
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">Tamil Nadu land intelligence</div>
          <h1>Every plot, proven.</h1>
          <p>
            Digitize land records, verify ownership history, and protect every parcel with a trusted public ledger.
          </p>

          <div className="search-card glass-panel">
            <div className="search-header">
              <div className="search-field">
                <span className="search-label">Search by</span>
                <span className="search-filter-pill">{searchFilter}</span>
              </div>
              <button className="microphone-button" type="button" aria-label="Voice search">🎙</button>
            </div>

            <div className="search-bar">
              <span className="search-icon">⌕</span>
              <input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value)
                  if (!event.target.value.trim()) {
                    setSuggestions([])
                    setSearchError('')
                  }
                }}
                aria-label="Search plot"
              />
              <button className="primary-button" type="button" onClick={() => void handleSearch()}>Search</button>
            </div>

            {suggestionsLoading && <p role="status">Searching parcels...</p>}
            {suggestions.length > 0 && (
              <div className="parcel-suggestions" role="listbox" aria-label="Parcel suggestions">
                {suggestions.slice(0, 5).map((parcel) => (
                  <button
                    type="button"
                    role="option"
                    key={`${parcel.survey_no}-${parcel.village}`}
                    onClick={() => void handleSearch(parcel)}
                  >
                    <strong>{parcel.survey_no}</strong> · {parcel.village} · {parcel.owner_name}
                  </button>
                ))}
              </div>
            )}
            {searchError && <p className="form-error" role="alert">{searchError}</p>}

            <div className="chip-row">
              {searchFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={filter === searchFilter ? 'chip active' : 'chip'}
                  onClick={() => setSearchFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => navigate('/verify')}>Scan to verify a document</button>
            <button className="secondary-button" type="button">Guided Demo</button>
          </div>

          <div className="trust-strip">
            {trustSignals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-passport glass-panel">
            <div className="passport-topline">
              <span className="status-badge verified">Verified</span>
              <span className="small-text">Land Passport</span>
            </div>

            <div className="passport-meta">
              <div>
                <small>Survey No.</small>
                <strong>{selectedParcel.surveyNumber}</strong>
              </div>
              <div>
                <small>Owner</small>
                <strong>{selectedParcel.owner.split(' ')[0]}</strong>
              </div>
            </div>

            <div className="mini-map">
              <div className="parcel-shape"></div>
              <div className="neighbor parcel-two"></div>
              <div className="neighbor parcel-three"></div>
            </div>

            <div className="passport-footer">
              <div>
                <small>Trust Level</small>
                <strong>{selectedParcel.trust}</strong>
              </div>
              <div className="qr-box" aria-label="QR code placeholder">
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-row" aria-label="Platform statistics">
        {statCards.map((stat) => (
          <div className="stat-card glass-panel" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="steps-section">
        <div className="section-header left">
          <span className="eyebrow gold">How it works</span>
          <h2>From survey file to trusted proof</h2>
        </div>

        <div className="steps-grid">
          {howItWorks.map((step) => (
            <article className="step-card glass-panel" key={step.step}>
              <span className="step-number">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="passport-section">
        <div className="passport-header">
          <div>
            <span className="eyebrow gold">Land Passport</span>
            <h2>Parcel verification snapshot</h2>
          </div>
          <div className="summary-actions">
            <button type="button" className="secondary-button small">Share</button>
            <button type="button" className="secondary-button small">Download certificate</button>
            <button type="button" className="primary-button small">Set alert</button>
          </div>
        </div>

        <div className="passport-summary glass-panel">
          <div className="summary-block">
            <span className="meta-label">Survey number</span>
            <strong>{selectedParcel.surveyNumber}</strong>
          </div>
          <div className="summary-block">
            <span className="meta-label">Village</span>
            <strong>{selectedParcel.village}</strong>
          </div>
          <div className="summary-block">
            <span className="meta-label">Taluk</span>
            <strong>{selectedParcel.taluk}</strong>
          </div>
          <div className="summary-block">
            <span className="meta-label">District</span>
            <strong>{selectedParcel.district}</strong>
          </div>
          <div className="summary-block">
            <span className="meta-label">Area</span>
            <strong>{selectedParcel.area}</strong>
          </div>
          <div className="summary-block">
            <span className="meta-label">Land type</span>
            <strong>{selectedParcel.landType}</strong>
          </div>
          <div className="summary-block">
            <span className="meta-label">Owner</span>
            <strong>{selectedParcel.owner}</strong>
          </div>
          <div className="summary-block status-box">
            <span className="meta-label">Status</span>
            <span className="status-badge verified">{selectedParcel.status}</span>
          </div>
        </div>

        <div className="passport-layout">
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

            <div className="map-canvas" aria-label="Parcel map visualization">
              <div className="grid-overlay"></div>
              <div className="parcel-boundary parcel-fill"></div>
              <div className="neighbor parcel-neighbor-a"></div>
              <div className="neighbor parcel-neighbor-b"></div>
              <div className="conflict-zone"></div>
              <div className="map-pin"></div>
            </div>
          </div>

          <aside className="facts-panel glass-panel">
            <div className="facts-header">
              <span className="eyebrow gold">Key facts</span>
              <button type="button" className="small-link">View full dossier</button>
            </div>

            <div className="facts-list">
              <div className="fact-row">
                <span>Survey No.</span>
                <strong>{selectedParcel.surveyNumber}</strong>
              </div>
              <div className="fact-row">
                <span>Village</span>
                <strong>{selectedParcel.village}</strong>
              </div>
              <div className="fact-row">
                <span>Taluk</span>
                <strong>{selectedParcel.taluk}</strong>
              </div>
              <div className="fact-row">
                <span>District</span>
                <strong>{selectedParcel.district}</strong>
              </div>
            </div>

            <div className="risk-box">
              <div className="risk-gauge" style={{ background: 'conic-gradient(#1fa96c 0 60%, #d8b45a 60% 82%, #d64a4a 82% 100%)' }}>
                <div className="gauge-inner">
                  <strong>{selectedParcel.riskScore}</strong>
                  <span>Risk</span>
                </div>
              </div>
              <div className="risk-summary">
                <h3>AI risk summary</h3>
                <p>Boundary overlap with survey 214/3 and a recent deed mismatch require officer review.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="insights-row">
        <div className="time-machine glass-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow gold">Ownership time machine</span>
              <h3>Transfer history</h3>
            </div>
            <button type="button" className="secondary-button small">Play</button>
          </div>

          <div className="timeline-track">
            {selectedParcel.transferHistory.map((entry) => (
              <button
                key={entry.year}
                type="button"
                className={selectedYear === entry.year ? 'timeline-point active' : 'timeline-point'}
                onClick={() => setSelectedYear(entry.year)}
              >
                <span className="dot"></span>
                <span>{entry.year}</span>
              </button>
            ))}
          </div>

          {activeHistory ? <div className="history-card">
            <div className="history-head">
              <span className="transfer-tag sale">{activeHistory.type}</span>
              <strong>{activeHistory.year}</strong>
            </div>
            <h4>{activeHistory.owner}</h4>
            <p>{activeHistory.note}</p>
          </div> : <p>No ownership history recorded.</p>}
        </div>

        <div className="documents-panel glass-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow gold">Records</span>
              <h3>Trusted documents</h3>
            </div>
          </div>

          <div className="tab-buttons">
            {documentTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'tab-button active' : 'tab-button'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="document-list">
            {selectedParcel.documents.map((document) => (
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
            {selectedParcel.documents.length === 0 && <p>No documents linked to this parcel yet.</p>}
          </div>
        </div>
      </section>

      <section className="verify-section glass-panel">
        <div className="verify-header">
          <div>
            <span className="eyebrow gold">Public verification</span>
            <h2>Check a certificate or QR code</h2>
          </div>
          <button type="button" className="secondary-button small" onClick={() => navigate('/verify')}>Verify PDF</button>
        </div>

        <div className="verify-layout">
          <div className="verify-input-card">
            <label htmlFor="certificate-input">Certificate ID</label>
            <div className="verify-search-row">
              <input id="certificate-input" defaultValue={selectedParcel.certificateId} />
              <button type="button" className="primary-button small" disabled={!selectedParcel.certificateId} onClick={() => navigate(`/verify/${selectedParcel.certificateId}`)}>Verify</button>
            </div>

            <div className="scan-box">
              <div className="scan-icon">◉</div>
              <span>Scan QR code or drag a PDF</span>
            </div>
          </div>

          <div className="verify-result success">
            <div className="result-tag">Authentic</div>
            <h3>{selectedParcel.surveyNumber}, {selectedParcel.village}</h3>
            <ul>
              <li><span>Owner</span><strong>{selectedParcel.owner}</strong></li>
              <li><span>Issue date</span><strong>02 Oct 2026</strong></li>
              <li><span>Officer</span><strong>K. Muthukumar</strong></li>
              <li><span>Hash match</span><strong>Verified</strong></li>
            </ul>
          </div>
        </div>
      </section>

      <div className="footer-strip">
        <span>AI checked</span>
        <span>QR verified</span>
        <span>Protected ledger</span>
        <span>Tamil & English</span>
      </div>
    </>
  )
}

export default LandingPage
