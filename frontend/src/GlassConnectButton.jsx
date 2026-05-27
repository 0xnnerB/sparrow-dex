import { ConnectButton } from '@rainbow-me/rainbowkit'

export function GlassConnectButton({ label = 'Connect Wallet' }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) return null
        const connected = account && chain

        if (!connected) {
          return (
            <button className="glass-connect-btn" onClick={openConnectModal} type="button">
              {label}
            </button>
          )
        }

        if (chain.unsupported) {
          return (
            <button className="glass-connect-btn glass-connect-btn--error" onClick={openChainModal} type="button">
              Wrong network
            </button>
          )
        }

        return (
          <div className="glass-connect-group">
            <button className="glass-connect-btn glass-connect-btn--chain" onClick={openChainModal} type="button">
              {chain.hasIcon && chain.iconUrl && (
                <img src={chain.iconUrl} alt={chain.name ?? 'chain'} className="glass-connect-chain-icon" />
              )}
              {chain.name}
            </button>
            <button className="glass-connect-btn" onClick={openAccountModal} type="button">
              {account.displayName}
              {account.displayBalance ? ` (${account.displayBalance})` : ''}
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
