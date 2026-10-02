function ScannerPage() {
  return (
    <div className="content-page narrow">
      <div className="page-heading">
        <div>
          <span className="eyebrow gold">Vision AI scanner</span>
          <h1>Document intake</h1>
        </div>
      </div>

      <div className="scanner-panel glass-panel">
        <div className="scan-box large">
          <div className="scan-icon">◉</div>
          <span>Drag and drop deed, patta, chitta, FMB sketch, or EC</span>
        </div>

        <div className="scanner-progress">
          <span>Reading document</span>
          <span>Detecting language</span>
          <span>Extracting fields</span>
          <span>Checking authenticity</span>
        </div>
      </div>
    </div>
  )
}

export default ScannerPage
