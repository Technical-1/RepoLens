import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
          borderRadius: '7px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            background: 'radial-gradient(circle, #58a6ff 0%, transparent 70%)',
            top: '2px',
            right: '2px',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            background: 'radial-gradient(circle, #a371f7 0%, transparent 70%)',
            bottom: '4px',
            left: '2px',
            opacity: 0.5,
          }}
        />
        {/* Lens with code brackets */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Outer lens ring with gradient effect */}
          <circle cx="10" cy="10" r="7" stroke="url(#lensGrad)" strokeWidth="2" />
          {/* Inner code brackets */}
          <path d="M7 8L5.5 10L7 12" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 8L14.5 10L13 12" stroke="#a371f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Handle */}
          <path d="M15 15L20 20" stroke="url(#handleGrad)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Gradients */}
          <defs>
            <linearGradient id="lensGrad" x1="3" y1="3" x2="17" y2="17">
              <stop offset="0%" stopColor="#3fb950" />
              <stop offset="50%" stopColor="#58a6ff" />
              <stop offset="100%" stopColor="#a371f7" />
            </linearGradient>
            <linearGradient id="handleGrad" x1="15" y1="15" x2="20" y2="20">
              <stop offset="0%" stopColor="#58a6ff" />
              <stop offset="100%" stopColor="#3fb950" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}

