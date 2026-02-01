import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DRIVENEX - Compare Car Offers'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo circle with D */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'white',
            marginBottom: 32,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#4F46E5',
            }}
          >
            D
          </span>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '-2px',
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          DRIVENEX
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.9)',
            marginTop: 16,
          }}
        >
          Compare Leasing, Purchase & Subscriptions
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: 12,
          }}
        >
          TCO Calculator for Germany
        </div>

        {/* Three comparison cards */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 48,
          }}
        >
          {['Leasing', 'Purchase', 'Subscription'].map((type) => (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <span style={{ color: 'white', fontSize: 18 }}>{type}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
