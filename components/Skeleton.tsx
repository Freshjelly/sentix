export function SkeletonBlock({ width, height }: { width?: string; height?: string }) {
  return (
    <div
      className="skeleton"
      style={{ width: width ?? '100%', height: height ?? '16px' }}
    />
  )
}

export function ScoreSkeleton() {
  return (
    <div>
      <div className="score-display">
        <SkeletonBlock width="120px" height="64px" />
        <div className="score-meta">
          <SkeletonBlock width="80px" height="10px" />
          <div style={{ marginTop: '8px' }} />
          <SkeletonBlock width="100px" height="22px" />
        </div>
      </div>
      <div className="bars">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bar-row">
            <div className="bar-name">
              <SkeletonBlock width="40px" height="10px" />
            </div>
            <div className="bar-track" style={{ flex: 1 }}>
              <SkeletonBlock height="8px" />
            </div>
            <div className="bar-pct">
              <SkeletonBlock width="28px" height="10px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PostsSkeleton() {
  return (
    <div className="posts-list">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="post-item">
          <SkeletonBlock width="40px" height="20px" />
          <div style={{ flex: 1 }}>
            <SkeletonBlock width="100%" height="13px" />
            <div style={{ marginTop: '6px' }} />
            <SkeletonBlock width="75%" height="13px" />
            <div style={{ marginTop: '6px' }} />
            <SkeletonBlock width="120px" height="10px" />
          </div>
        </div>
      ))}
    </div>
  )
}
