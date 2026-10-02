import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mockParcels } from '../data/mockParcels'
import { getCertificate, getParcel } from '../lib/api'

function VerifyPage() {
  const navigate = useNavigate()
  const [certificateId, setCertificateId] = useState('ST-2026-000123')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const verify = async () => {
    setLoading(true)
    setError('')
    try {
      const certificate = await getCertificate(certificateId)
      if (!certificate) {
        setResult({ status: 'not_found' })
        return
      }
      const parcel = await getParcel(certificate.parcel_id)
      setResult({ status: 'authentic', certificate, parcel })
    } catch (cause) {
      const fallback = mockParcels.find((parcel) => parcel.certificateId === certificateId.trim())
      setError(cause.message || 'Certificate lookup failed.')
      setResult(fallback ? { status: 'offline', parcel: fallback } : null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-page narrow">
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">Public verification</span>
          <h1>Verify a certificate</h1>
        </div>
      </div>

      <div className="verify-layout single-layout">
        <div className="verify-input-card glass-panel">
          <label htmlFor="verify-input">Certificate ID</label>
          <div className="verify-search-row">
            <input id="verify-input" value={certificateId} onChange={(event) => setCertificateId(event.target.value)} />
            <button type="button" className="primary-button small" disabled={loading} onClick={() => void verify()}>
              {loading ? 'Checking...' : 'Verify'}
            </button>
          </div>

          <div className="scan-box">
            <div className="scan-icon">◉</div>
            <span>Scan QR code or drag a PDF</span>
          </div>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {result?.status === 'not_found' && <p role="status">No certificate matched that ID.</p>}
        {result?.parcel && (
          <div className="verify-result glass-panel success">
            <div className="result-tag">{result.status === 'authentic' ? 'Authentic' : 'Offline demo'}</div>
            <h3>{result.parcel.surveyNumber ?? result.parcel.survey_no}, {result.parcel.village}</h3>
            <ul>
              <li><span>Owner</span><strong>{result.parcel.owner ?? result.parcel.owner_name}</strong></li>
              <li><span>Issue date</span><strong>{result.certificate?.issued_at ? new Date(result.certificate.issued_at).toLocaleDateString() : 'Demo record'}</strong></li>
              <li><span>Certificate</span><strong>{result.certificate?.certificate_no ?? result.parcel.certificateId}</strong></li>
              <li><span>Hash</span><strong>{result.certificate?.file_hash ?? result.parcel.hash ?? 'Not available'}</strong></li>
            </ul>
            {result.certificate && <button type="button" className="secondary-button small" onClick={() => navigate(`/verify/${result.certificate.certificate_no}`)}>Open verification record</button>}
          </div>
        )}
      </div>

      <div className="links-row">
        <Link to="/parcel/123-4A" className="secondary-button small">Open parcel</Link>
        <Link to="/scanner" className="secondary-button small">Use scanner</Link>
      </div>
    </div>
  )
}

export default VerifyPage
