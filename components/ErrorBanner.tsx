interface Props {
  message: string
  onRetry: () => void
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div
      style={{
        border: '1px solid var(--red)',
        background: 'rgba(255,69,96,0.05)',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '12px 0',
        borderRadius: '2px',
      }}
    >
      <span style={{ color: 'var(--red)', fontSize: '11px' }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          background: 'transparent',
          border: '1px solid var(--red)',
          color: 'var(--red)',
          padding: '4px 12px',
          cursor: 'pointer',
          fontSize: '9px',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginLeft: '12px',
          flexShrink: 0,
        }}
      >
        リトライ
      </button>
    </div>
  )
}
