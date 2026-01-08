import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent glows */}
        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, #58a6ff 0%, transparent 70%)',
            top: '10px',
            right: '10px',
            opacity: 0.4,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, #a371f7 0%, transparent 70%)',
            bottom: '20px',
            left: '15px',
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, #3fb950 0%, transparent 70%)',
            top: '60px',
            left: '25px',
            opacity: 0.3,
          }}
        />
        {/* Lens with code brackets */}
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Outer lens ring with gradient effect */}
          <circle cx="10" cy="10" r="7" stroke="url(#lensGrad)" strokeWidth="1.8" />
          {/* Glass reflection */}
          <circle cx="10" cy="10" r="5.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          {/* Inner code brackets */}
          <path d="M7 8L5.5 10L7 12" stroke="#58a6ff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 8L14.5 10L13 12" stroke="#a371f7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Center dot */}
          <circle cx="10" cy="10" r="0.8" fill="#3fb950" />
          {/* Handle */}
          <path d="M15 15L20 20" stroke="url(#handleGrad)" strokeWidth="2.2" strokeLinecap="round" />
          {/* Handle shine */}
          <path d="M16 16L19 19" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeLinecap="round" />
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

