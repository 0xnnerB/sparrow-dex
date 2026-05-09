import { useState } from 'react'

const STORAGE_KEY = 'sparrow_disclaimer_accepted'

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY))

  if (!visible) return null

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="disclaimer-backdrop">
      <div className="disclaimer-modal">
        <div className="disclaimer-title">⚠️ Testnet Only – Beta Version</div>
        <ul className="disclaimer-list">
          <li>Sparrow DEX is currently in testnet phase. Do not use real funds.</li>
          <li>This app only works with testnet tokens — real assets cannot be used here.</li>
          <li>Use a burn wallet or create a new dedicated wallet exclusively for testing.</li>
          <li>Never connect a wallet that holds real funds to this application.</li>
          <li>All transactions are on test networks only and have no real monetary value.</li>
        </ul>
        <p className="disclaimer-footer">
          By continuing, you acknowledge that this is a beta testnet application.
        </p>
        <button className="disclaimer-btn" onClick={handleAccept}>
          I Understand &amp; Continue
        </button>
      </div>
    </div>
  )
}
