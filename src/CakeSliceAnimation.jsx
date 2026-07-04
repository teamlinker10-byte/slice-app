import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'

const KNIFE_X = 18
const ARC_Y   = -14
const CUT_Y   =  44
// 케이크 표면에서 빠르게 찌르고 하단에서 저항으로 감속하는 중간 지점 (60% 지점)
const MID_Y   = ARC_Y + (CUT_Y - ARC_Y) * 0.6  // ≈ 20.8vh

// Kitsch sparkle shapes
function KitschStar({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 1 L14.5 9 L23 9 L16.5 14 L19 22 L12 17.5 L5 22 L7.5 14 L1 9 L9.5 9 Z"
        fill={color}
        stroke="white"
        strokeWidth="0.8"
      />
    </svg>
  )
}

function KitschHeart({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 21 L3 12 C1 10 1 7 3 5 C5 3 8 3 10 5 L12 7 L14 5 C16 3 19 3 21 5 C23 7 23 10 21 12 Z"
        fill={color}
        stroke="white"
        strokeWidth="0.8"
      />
    </svg>
  )
}

function KitschDiamond({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon
        points="12,2 22,12 12,22 2,12"
        fill={color}
        stroke="white"
        strokeWidth="0.8"
      />
    </svg>
  )
}

function KitschCircle({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill={color} stroke="white" strokeWidth="0.8" />
    </svg>
  )
}

const SHAPES = [KitschStar, KitschHeart, KitschDiamond, KitschCircle]
const COLORS = ['#FF4DAD', '#FFE000', '#00E5FF', '#C84BFF', '#00FF88', '#FF6B2B', '#FF94CC', '#B4FF00']

const CAKE_SPARKLES = [
  { x: -22, y: -32, delay: 0.00, size: 22, shape: 0, color: 0 },
  { x:  -4, y: -36, delay: 0.03, size: 28, shape: 1, color: 1 },
  { x:  20, y: -30, delay: 0.06, size: 18, shape: 2, color: 2 },
  { x: -30, y: -16, delay: 0.04, size: 16, shape: 3, color: 3 },
  { x:  -9, y: -20, delay: 0.08, size: 26, shape: 0, color: 4 },
  { x:  14, y: -22, delay: 0.02, size: 20, shape: 1, color: 5 },
  { x:  28, y: -10, delay: 0.07, size: 14, shape: 2, color: 6 },
  { x: -26, y:   2, delay: 0.10, size: 24, shape: 3, color: 7 },
  { x:  -6, y:   4, delay: 0.01, size: 18, shape: 0, color: 1 },
  { x:  10, y:  -2, delay: 0.09, size: 22, shape: 1, color: 2 },
  { x:  26, y:   6, delay: 0.05, size: 16, shape: 2, color: 0 },
  { x: -20, y:  18, delay: 0.12, size: 26, shape: 3, color: 3 },
  { x:   4, y:  20, delay: 0.06, size: 14, shape: 0, color: 4 },
  { x:  22, y:  16, delay: 0.11, size: 28, shape: 1, color: 5 },
  { x: -28, y:  30, delay: 0.08, size: 20, shape: 2, color: 6 },
  { x:  -8, y:  34, delay: 0.14, size: 16, shape: 3, color: 7 },
  { x:  16, y:  28, delay: 0.04, size: 24, shape: 0, color: 0 },
  { x:  30, y:  24, delay: 0.13, size: 18, shape: 1, color: 2 },
]

export default function CakeSliceAnimation({ cake, onComplete }) {
  const knife = useAnimation()
  const [cutting, setCutting] = useState(false)

  useEffect(() => { runCut() }, [])

  async function runCut() {
    await knife.start({
      x: `${KNIFE_X}vw`,
      y: `${ARC_Y}vh`,
      transition: {
        duration: 0.9,
        x: { ease: [0.55, 0, 0.25, 1] },
        y: { ease: [0.0,  0, 0.65, 1] },
      },
    })

    setCutting(true)
    await knife.start({
      y: [`${ARC_Y}vh`, `${MID_Y}vh`, `${CUT_Y}vh`],
      transition: {
        duration: 0.55,
        times: [0, 0.28, 1],
        ease: ['easeIn', 'easeOut'],
      },
    })
    setCutting(false)

    await knife.start({ opacity: 0, transition: { duration: 0.3 } })
    onComplete()
  }

  return (
    <>
      <div className="cake-bg-wrap">
        <img
          src={cake.img}
          alt=""
          className="cake-bg"
          style={cake.yOffset ? { transform: `translateY(${cake.yOffset}vh)` } : undefined}
        />
        <div className="cake-vignette" />
      </div>

      {/* Kitsch sparkles across the whole cake */}
      {cutting && CAKE_SPARKLES.map((s, i) => {
        const Shape = SHAPES[s.shape]
        const color = COLORS[s.color]
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${s.x}vw - ${s.size / 2}px)`,
              top:  `calc(50% + ${s.y}vh - ${s.size / 2}px)`,
              width: s.size,
              height: s.size,
              pointerEvents: 'none',
              zIndex: 210,
              filter: 'drop-shadow(0 0 4px white)',
            }}
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{
              scale:   [0, 1.8, 1.2, 0],
              opacity: [0, 1,   1,   0],
              rotate:  [-20, 15, 30, 60],
            }}
            transition={{ duration: 0.75, delay: s.delay, ease: 'easeOut' }}
          >
            <Shape color={color} size={s.size} />
          </motion.div>
        )
      })}

      {/* Knife */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 300, pointerEvents: 'none' }}>
        <motion.img
          src="/knife.png"
          alt=""
          style={{
            width: '38vw',
            marginLeft: '-19vw',
            marginTop: '-13vw',
            rotate: -15,
            mixBlendMode: 'multiply',
            display: 'block',
          }}
          initial={{ x: `${KNIFE_X + 34}vw`, y: '-42vh', opacity: 1 }}
          animate={knife}
        />
      </div>
    </>
  )
}
