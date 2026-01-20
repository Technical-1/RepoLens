import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'RepoLens - GitHub Repository Stats Analyzer'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            RepoLens
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '36px',
            background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 50%, #f778ba 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          GitHub Repository Stats Analyzer
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '24px',
            color: '#8b949e',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          Lines of code • Language breakdown • Commit history • Contributors
        </div>

        {/* Stats preview boxes */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '50px',
          }}
        >
          {[
            { label: 'Languages', color: '#58a6ff' },
            { label: 'Commits', color: '#a371f7' },
            { label: 'Contributors', color: '#3fb950' },
            { label: 'Code Stats', color: '#f778ba' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '16px 32px',
                background: 'rgba(48, 54, 61, 0.5)',
                borderRadius: '12px',
                border: `1px solid ${item.color}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: item.color,
                }}
              />
              <span style={{ color: '#c9d1d9', fontSize: '20px' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

