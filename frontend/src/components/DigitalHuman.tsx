import { useMemo } from 'react'

export type Emotion = 'neutral' | 'happy' | 'thinking' | 'surprised' | 'sad'

export interface PersonaVisual {
  hairColor: string
  hairStyle: 'short' | 'medium' | 'long'
  skinTone: string
  collarColor: string
  glasses: boolean
  gender: 'female' | 'male'
}

interface Props {
  speaking: boolean
  emotion?: Emotion
  listening?: boolean
  size?: number
  visual?: PersonaVisual
}

const DEFAULT_VISUAL: PersonaVisual = {
  hairColor: '#3d2b1f',
  hairStyle: 'medium',
  skinTone: '#f5e8dc',
  collarColor: '#d4c4ae',
  glasses: false,
  gender: 'female',
}

export default function DigitalHuman({
  speaking,
  emotion = 'neutral',
  listening = false,
  size = 180,
  visual = DEFAULT_VISUAL,
}: Props) {
  const isMale = visual.gender === 'male'

  // CSS animation classes
  const animClass = speaking ? 'dh-speaking' : listening ? 'dh-listening' : ''

  const styles = useMemo(() => {
    const s = size
    const h = s * 0.30        // head radius
    const hc = visual.hairColor
    const skin = visual.skinTone
    const collar = visual.collarColor
    const isShort = visual.hairStyle === 'short'
    const isMed = visual.hairStyle === 'medium'
    const isLong = visual.hairStyle === 'long'

    // Hair path
    let hairPath = ''
    if (isShort) {
      hairPath = `M${s * 0.20},${s * 0.38} Q${s * 0.50},${s * 0.22} ${s * 0.80},${s * 0.38} Q${s * 0.88},${s * 0.42} ${s * 0.82},${s * 0.45} L${s * 0.75},${s * 0.43} Q${s * 0.60},${s * 0.52} ${s * 0.50},${s * 0.38} Q${s * 0.40},${s * 0.52} ${s * 0.25},${s * 0.43} L${s * 0.18},${s * 0.45} Z`
    } else if (isLong) {
      hairPath = `M${s * 0.18},${s * 0.36} Q${s * 0.50},${s * 0.18} ${s * 0.82},${s * 0.36} Q${s * 0.90},${s * 0.55} ${s * 0.82},${s * 0.70} Q${s * 0.72},${s * 0.62} ${s * 0.68},${s * 0.48} Q${s * 0.52},${s * 0.54} ${s * 0.50},${s * 0.38} Q${s * 0.48},${s * 0.54} ${s * 0.32},${s * 0.48} Q${s * 0.28},${s * 0.62} ${s * 0.18},${s * 0.70} Q${s * 0.10},${s * 0.55} Z`
    } else {
      // medium bob
      hairPath = `M${s * 0.20},${s * 0.36} Q${s * 0.50},${s * 0.20} ${s * 0.80},${s * 0.36} Q${s * 0.88},${s * 0.50} ${s * 0.80},${s * 0.55} Q${s * 0.68},${s * 0.50} ${s * 0.62},${s * 0.42} Q${s * 0.52},${s * 0.52} ${s * 0.50},${s * 0.38} Q${s * 0.48},${s * 0.52} ${s * 0.38},${s * 0.42} Q${s * 0.32},${s * 0.50} ${s * 0.20},${s * 0.55} Q${s * 0.12},${s * 0.50} Z`
    }

    // Eye position
    const eyeY = s * 0.44
    const eyeSpacing = s * 0.072

    // Mouth
    const mouthY = s * 0.58
    const mouthR = s * 0.03

    // Eyebrow
    const browY = eyeY - s * 0.042

    return { s, h, hc, skin, collar, isShort, isMed, isLong, hairPath, eyeY, eyeSpacing, mouthY, mouthR, browY }
  }, [size, visual])

  const { s, hc, skin, collar, hairPath, eyeY, eyeSpacing, mouthY, mouthR, browY } = styles

  // Emotion-based modifications
  const blushAlpha = isMale ? 0.10 : (emotion === 'happy' ? 0.35 : emotion === 'surprised' ? 0.18 : 0.20)

  // Eye state
  const showingEyes = true // eyes always open for SVG simplicity

  // Mouth
  let mouthEl: JSX.Element
  if (speaking) {
    mouthEl = <ellipse cx={s * 0.50} cy={mouthY} rx={mouthR * 1.3} ry={mouthR * 2.2} fill="#c05850" stroke="#c48072" strokeWidth="0.8" />
  } else if (emotion === 'happy') {
    mouthEl = <path d={`M${s * 0.46},${mouthY - mouthR} Q${s * 0.50},${mouthY + mouthR * 1.8} ${s * 0.54},${mouthY - mouthR}`} stroke="#d48278" strokeWidth="1.2" fill="transparent" strokeLinecap="round" />
  } else if (emotion === 'surprised') {
    mouthEl = <circle cx={s * 0.50} cy={mouthY} r={mouthR * 1.5} fill="#c05850" />
  } else if (emotion === 'sad') {
    mouthEl = <path d={`M${s * 0.46},${mouthY + mouthR} Q${s * 0.50},${mouthY - mouthR * 0.5} ${s * 0.54},${mouthY + mouthR}`} stroke="#c48878" strokeWidth="1.0" fill="transparent" strokeLinecap="round" />
  } else {
    mouthEl = <path d={`M${s * 0.46},${mouthY} Q${s * 0.50},${mouthY + mouthR} ${s * 0.54},${mouthY}`} stroke={isMale ? '#c89888' : '#d48278'} strokeWidth="1.0" fill="transparent" strokeLinecap="round" />
  }

  return (
    <div
      className={`dh-container ${animClass}`}
      style={{
        width: size, height: size,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        background: `radial-gradient(circle at 50% 40%, ${skin} 0%, ${darken(skin, 0.08)} 100%)`,
        boxShadow: listening
          ? `0 0 0 3px rgba(255,100,100,0.35), 0 0 0 6px rgba(255,100,100,0.12)`
          : speaking
            ? `0 0 0 2px rgba(100,200,100,0.30)`
            : '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s',
      }}
    >
      <style>{`
        @keyframes dh-idle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1.5%) scale(1.02); }
        }
        @keyframes dh-float {
          0%, 100% { transform: translateY(0) scale(1); }
          33% { transform: translateY(-2.5%) scale(1.03); }
          66% { transform: translateY(-1%) scale(1.01); }
        }
        @keyframes dh-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.30; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.55; }
        }
        .dh-container {
          display: flex; align-items: center; justify-content: center;
          animation: dh-idle 3.5s ease-in-out infinite;
        }
        .dh-speaking { animation: dh-float 1.3s ease-in-out infinite; }
        .dh-listening { animation: dh-idle 2s ease-in-out infinite; }
        .dh-listening .dh-pulse-ring { display: block; }
        .dh-pulse-ring { display: none; }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', position: 'relative', zIndex: 1 }}
      >
        {/* Hair back */}
        <path d={hairPath} fill={hc} />

        {/* Face oval */}
        <ellipse
          cx={s * 0.50} cy={s * 0.48}
          rx={isMale ? s * 0.195 : s * 0.185}
          ry={isMale ? s * 0.185 : s * 0.195}
          fill={skin}
          stroke={darken(skin, 0.06)}
          strokeWidth="0.4"
        />

        {/* Ears (high detail sizes only) */}
        {size >= 100 && (
          <>
            <ellipse cx={s * 0.30} cy={s * 0.47} rx={s * 0.025} ry={s * 0.042} fill={darken(skin, 0.10)} />
            <ellipse cx={s * 0.70} cy={s * 0.47} rx={s * 0.025} ry={s * 0.042} fill={darken(skin, 0.10)} />
          </>
        )}

        {/* Eyebrows */}
        <path
          d={`M${s * 0.41},${browY} Q${s * 0.43 + (emotion === 'surprised' ? 0.015 : emotion === 'sad' ? -0.01 : 0)},${browY - (emotion === 'surprised' ? 0.012 : emotion === 'happy' ? 0.005 : 0)} ${s * 0.46},${browY - (emotion === 'surprised' ? 0.008 : 0)}`}
          stroke={darken(hc, 0.1)}
          strokeWidth={isMale ? 0.022 * s : 0.016 * s}
          strokeLinecap="round"
          fill="transparent"
        />
        <path
          d={`M${s * 0.59},${browY} Q${s * 0.57 - (emotion === 'surprised' ? 0.015 : emotion === 'sad' ? 0.01 : 0)},${browY - (emotion === 'surprised' ? 0.012 : emotion === 'happy' ? 0.005 : 0)} ${s * 0.54},${browY - (emotion === 'surprised' ? 0.008 : 0)}`}
          stroke={darken(hc, 0.1)}
          strokeWidth={isMale ? 0.022 * s : 0.016 * s}
          strokeLinecap="round"
          fill="transparent"
        />

        {/* Eyes */}
        <ellipse cx={s * 0.435} cy={eyeY} rx={isMale ? s * 0.025 : s * 0.028} ry={isMale ? s * 0.032 : s * 0.036} fill="white" />
        <ellipse cx={s * 0.565} cy={eyeY} rx={isMale ? s * 0.025 : s * 0.028} ry={isMale ? s * 0.032 : s * 0.036} fill="white" />
        {/* Iris */}
        <circle cx={s * 0.435} cy={eyeY} r={isMale ? s * 0.014 : s * 0.016} fill={hc} />
        <circle cx={s * 0.565} cy={eyeY} r={isMale ? s * 0.014 : s * 0.016} fill={hc} />
        {/* Pupil */}
        <circle cx={s * 0.435} cy={eyeY} r={s * 0.007} fill="#0a0a0a" />
        <circle cx={s * 0.565} cy={eyeY} r={s * 0.007} fill="#0a0a0a" />
        {/* Eye highlight */}
        <circle cx={s * 0.431} cy={eyeY - s * 0.012} r={s * 0.005} fill="white" />
        <circle cx={s * 0.561} cy={eyeY - s * 0.012} r={s * 0.005} fill="white" />

        {/* Eyelashes (female only, larger sizes) */}
        {!isMale && size >= 80 && (
          <>
            <path d={`M${s * 0.41},${eyeY - s * 0.03} L${s * 0.40},${eyeY - s * 0.05}`} stroke={darken(hc, 0.1)} strokeWidth="0.6" strokeLinecap="round" />
            <path d={`M${s * 0.44},${eyeY - s * 0.035} L${s * 0.435},${eyeY - s * 0.055}`} stroke={darken(hc, 0.1)} strokeWidth="0.6" strokeLinecap="round" />
            <path d={`M${s * 0.59},${eyeY - s * 0.03} L${s * 0.60},${eyeY - s * 0.05}`} stroke={darken(hc, 0.1)} strokeWidth="0.6" strokeLinecap="round" />
            <path d={`M${s * 0.56},${eyeY - s * 0.035} L${s * 0.565},${eyeY - s * 0.055}`} stroke={darken(hc, 0.1)} strokeWidth="0.6" strokeLinecap="round" />
          </>
        )}

        {/* Nose */}
        <path
          d={`M${s * 0.50},${s * 0.49} L${s * 0.50},${s * 0.53}`}
          stroke={darken(skin, 0.12)}
          strokeWidth="0.7"
          strokeLinecap="round"
        />

        {/* Mouth */}
        {mouthEl}

        {/* Blush */}
        <ellipse cx={s * 0.41} cy={s * 0.53} rx={s * 0.03} ry={s * 0.018} fill={`rgba(255,140,130,${blushAlpha})`} />
        <ellipse cx={s * 0.59} cy={s * 0.53} rx={s * 0.03} ry={s * 0.018} fill={`rgba(255,140,130,${blushAlpha})`} />

        {/* Glasses */}
        {visual.glasses && size >= 60 && (
          <>
            <rect x={s * 0.395} y={eyeY - s * 0.037} width={s * 0.082} height={s * 0.075} rx={s * 0.012} fill="none" stroke="#3a2a20" strokeWidth={s * 0.007} />
            <rect x={s * 0.523} y={eyeY - s * 0.037} width={s * 0.082} height={s * 0.075} rx={s * 0.012} fill="none" stroke="#3a2a20" strokeWidth={s * 0.007} />
            <line x1={s * 0.477} y1={eyeY} x2={s * 0.523} y2={eyeY} stroke="#3a2a20" strokeWidth={s * 0.005} />
          </>
        )}

        {/* Collar */}
        <path
          d={`M${s * 0.38},${s * 0.63} L${s * 0.50},${s * 0.72} L${s * 0.62},${s * 0.63}`}
          fill={collar}
          stroke={darken(collar, 0.15)}
          strokeWidth="0.6"
        />

        {/* Thinking bubbles */}
        {emotion === 'thinking' && size >= 80 && (
          <>
            <circle cx={s * 0.72} cy={s * 0.22} r={s * 0.016} fill="rgba(200,200,230,0.45)">
              <animate attributeName="cy" values={`${s * 0.22};${s * 0.20};${s * 0.22}`} dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={s * 0.76} cy={s * 0.17} r={s * 0.020} fill="rgba(200,200,230,0.40)">
              <animate attributeName="cy" values={`${s * 0.17};${s * 0.15};${s * 0.17}`} dur="1.5s" begin="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx={s * 0.80} cy={s * 0.13} r={s * 0.025} fill="rgba(200,200,230,0.35)">
              <animate attributeName="cy" values={`${s * 0.13};${s * 0.11};${s * 0.13}`} dur="1.5s" begin="0.4s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>

      {/* Listening pulsing ring */}
      {listening && (
        <div
          className="dh-pulse-ring"
          style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: '2px solid rgba(255,100,100,0.4)',
            animation: 'dh-pulse 1.2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

function darken(hex: string, amt: number): string {
  const [r, g, b] = parseHex(hex)
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amt)))
  return `#${h(d(r))}${h(d(g))}${h(d(b))}`
}

function parseHex(hx: string): [number, number, number] {
  return [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]
}

function h(v: number) { return v.toString(16).padStart(2, '0') }
