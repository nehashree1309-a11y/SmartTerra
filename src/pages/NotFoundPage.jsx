import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="content-page narrow centered">
      <div className="not-found glass-panel">
        <span className="eyebrow gold">404</span>
        <h1>Page not found</h1>
        <p>The parcel or verification screen you requested is unavailable in this demo.</p>
        <div className="links-row">
          <Link to="/" className="primary-button small">Go home</Link>
          <Link to="/verify" className="secondary-button small">Verify a document</Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
