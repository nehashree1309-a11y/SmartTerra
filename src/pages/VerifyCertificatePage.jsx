import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mockParcels } from '../data/mockParcels'
import { getCertificate, getParcel, mapParcelToView } from '../lib/api'

function VerifyCertificatePage() {
  const { certificateId } = useParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadedId, setLoadedId] = useState(null)

  useEffect(() => {
    let active = true
    const loadCertificate = async () => {
      try {
        const certificate = await getCertificate(certificateId)
        if (!certificate) {
          if (active) {
            setResult({ status: 'not_found' })
            setLoadedId(certificateId)
          }
          return
        }
        const parcel = await getParcel(certificate.parcel_id)
        if (active) {
          setResult({
            status: 'authentic',
            certificate,
            parcel: parcel ? mapParcelToView(parcel) : null,
          })
          setError('')
          setLoadedId(certificateId)
        }
      } catch (cause) {
        if (!active) return
        const fallback = mockParcels.find((parcel) => parcel.certificateId === certificateId)
        setResult(fallback ? { status: 'offline', parcel: fallback } : null)
        setError(cause.message || 'Certificate lookup failed.')
        setLoadedId(certificateId)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadCertificate()
    return () => { active = false }
  }, [certificateId])

  if (loading || loadedId !== certificateId) {
    return <div className="content-page narrow"><p role="status">Checking certificate...</p></div>
  }

  return (
    <div className="content-page narrow">
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">Certificate check</span>
          <h1>{certificateId || 'ST-2026-000123'}</h1>
        </div>
      </div>

      {result?.status === 'not_found' && <p role="status">No certificate matched this ID.</p>}
      {result?.parcel && (
        <div className="verify-result glass-panel success large-result">
          <div className="result-tag">{result.status === 'authentic' ? 'Authentic' : 'Offline demo'}</div>
          <h3>{result.parcel.surveyNumber}, {result.parcel.village}</h3>
          <ul>
            <li><span>Parcel</span><strong>{result.parcel.surveyNumber}</strong></li>
            <li><span>Owner</span><strong>{result.parcel.owner}</strong></li>
            <li><span>Issue date</span><strong>{result.certificate?.issued_at ? new Date(result.certificate.issued_at).toLocaleDateString() : 'Demo record'}</strong></li>
            <li><span>Issuing officer</span><strong>{result.certificate?.issued_by ?? 'Demo record'}</strong></li>
            <li><span>File hash</span><strong>{result.certificate?.file_hash ?? result.parcel.hash ?? 'Not available'}</strong></li>
          </ul>
        </div>
      )}

      <div className="links-row">
        {result?.parcel && <Link to={`/parcel/${result.parcel.id}`} className="primary-button small">Open parcel</Link>}
        <Link to="/verify" className="secondary-button small">Back to verification</Link>
      </div>
    </div>
  )
}

export default VerifyCertificatePage
