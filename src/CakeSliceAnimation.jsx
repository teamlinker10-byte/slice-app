import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'

const KNIFE_X = 18
const ARC_Y   = -14
const CUT_Y   =  44
// 케이크 표면에서 빠르게 찌르고 하단에서 저항으로 감속하는 중간 지점 (60% 지점)
const MID_Y   = ARC_Y + (CUT_Y - ARC_Y) * 0.6  // ≈ 20.8vh

const wait = ms => new Promise(r => setTimeout(r, ms))

export default function CakeSliceAnimation({ cake, onComplete }) {
  const knife = useAnimation()
  const cakeMotion = useAnimation()
  const [showCrack, setShowCrack] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    runCut()
  }, [])

  async function runCut() {
    // 칼 등장
    await knife.start({
      x: `${KNIFE_X}vw`,
      y: `${ARC_Y}vh`,
      transition: {
        // Per-key transitions don't inherit the top-level duration in
        // framer-motion, so it must be repeated on each or they silently
        // fall back to the 0.3s tween default.
        x: { duration: 0.9, ease: [0.55, 0, 0.25, 1] },
        y: { duration: 0.9, ease: [0.0,  0, 0.65, 1] },
      },
    })

    // 칼 내려감 — "슥" + 황금선 동시 등장
    setShowCrack(true)
    await knife.start({
      y: [`${ARC_Y}vh`, `${MID_Y}vh`, `${CUT_Y}vh`],
      transition: {
        duration: 0.38,
        times: [0, 0.28, 1],
        ease: ['easeIn', 'easeOut'],
      },
    })

    // 잠깐 멈춤
    await wait(150)

    // 칼 퇴장 (크랙 라인은 이미 표시된 채로 서서히 사라짐)
    knife.start({ opacity: 0, transition: { duration: 0.3 } })
    await wait(300)

    // 표면이 출렁이다 잦아드는 정착 모션 (자른 직후, 칼이 사라진 뒤)
    await cakeMotion.start({
      scale: [1, 1.06, 1.04, 1.05, 1.05, 1.05],
      x: [0, -7, 6, -5, 4, -2.5, 1.5, -0.5, 0],
      rotate: [0, -1.4, 1.2, -1, 0.7, -0.4, 0.2, -0.1, 0],
      skewX: [0, 1.1, -0.7, 0.4, -0.2, 0.1, 0],
      transition: { duration: 0.85, ease: 'easeOut' },
    })

    // 조각 케이크 등장 (크로스페이드) — 확대 상태를 유지하며 자연스럽게 정착
    setRevealed(true)
    await cakeMotion.start({
      scale: 1,
      x: 0,
      rotate: 0,
      skewX: 0,
      transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
    })

    onComplete()
  }

  return (
    <>
      <motion.div className="cake-bg-wrap" animate={cakeMotion}>
        <img
          src={cake.img}
          alt=""
          className="cake-bg"
          style={{
            opacity: revealed ? 0 : 1,
            ...(cake.yOffset ? { transform: `translateY(${cake.yOffset}vh)` } : null),
          }}
        />
        <div className="cake-bg-wrap-overlay">
          <img src={cake.slice} alt="" className="cake-bg" style={{ opacity: revealed ? 1 : 0 }} />
        </div>
        <div className="cake-vignette" />
      </motion.div>

      {showCrack && <div className="cut-line" />}

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
