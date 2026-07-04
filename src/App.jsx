import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import CakeSliceAnimation from './CakeSliceAnimation'

const API_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_URL = 'https://api.themoviedb.org/3'
const POSTER   = 'https://image.tmdb.org/t/p/w185'

const CARD_W    = 204
const CARD_H    = 82
const MIN_SHARE = 4
const MAX_MOVIES = 10

const cakes = [
  { id: 1, name: '체리 화이트', img: '/ch_h.png',  thumb: '/ch_h.png',  yOffset: 0 },
  { id: 2, name: '초콜릿',      img: '/cho_h.png', thumb: '/cho_h.png', yOffset: 0 },
  { id: 3, name: '딸기',        img: '/sb_h.png',  thumb: '/sb_h.png',  yOffset: 3 },
]

function findFreePos(existing, cW, cH) {
  const gap = 16
  // Search panel: right=28, width=296 → left edge at cW-324
  // Card right edge must stay 16px clear → card_x ≤ cW-324-16-CARD_W = cW-544
  const xMax = Math.max(cW * 0.5, cW - 544)
  // Mirror right exclusion on left so distribution centers around cake (cW/2)
  const xMin = Math.max(16, Math.min(cW * 0.22, xMax - CARD_W - gap))
  const yMin = Math.max(16, cH * 0.08)
  const yMax = Math.min(cH - CARD_H - 110, cH * 0.86)
  for (let t = 0; t < 400; t++) {
    const x = xMin + Math.random() * (xMax - xMin)
    const y = yMin + Math.random() * (yMax - yMin)
    const ok = !existing.some(
      p => x < p.x + p.w + gap && x + CARD_W + gap > p.x && y < p.y + p.h + gap && y + CARD_H + gap > p.y
    )
    if (ok) return { x, y, w: CARD_W, h: CARD_H }
  }
  const i = existing.length
  return { x: xMin + (i % 3) * (CARD_W + gap), y: yMin + Math.floor(i / 3) * (CARD_H + gap), w: CARD_W, h: CARD_H }
}

function genCollagePos(count, cW, cH, pW, pH, gap = 10) {
  const placed = []
  for (let i = 0; i < count; i++) {
    let pos = null
    for (let t = 0; t < 300; t++) {
      const x = gap + Math.random() * (cW - pW - gap * 2)
      const y = gap + Math.random() * (cH - pH - gap * 2)
      if (!placed.some(p => x < p.x + p.w + gap && x + pW + gap > p.x && y < p.y + p.h + gap && y + pH + gap > p.y)) {
        pos = { x, y, w: pW, h: pH }; break
      }
    }
    if (!pos) {
      const cols = Math.ceil(Math.sqrt(count))
      pos = { x: (i % cols) * (pW + gap) + gap, y: Math.floor(i / cols) * (pH + gap) + gap, w: pW, h: pH }
    }
    placed.push(pos)
  }
  return placed
}

function KnifeIcon() {
  return (
    <svg viewBox="0 0 56 80" width="18" height="26" fill="none">
      <path d="M8 54 L28 6 L48 54 Z" fill="#ccc" stroke="#aaa" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="6" y="54" width="44" height="6" rx="2" fill="#8B5E3C"/>
      <rect x="20" y="60" width="16" height="16" rx="3.5" fill="#6B3F22"/>
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )
}

function MovieCard({ movie, onRemove }) {
  return (
    <div className="movie-card" style={{ left: movie.pos.x, top: movie.pos.y }}>
      <button className="card-x" onClick={() => onRemove(movie.id)}>✕</button>
      {movie.poster_path
        ? <img className="card-poster" src={`${POSTER}${movie.poster_path}`} alt="" />
        : <div className="card-poster no-poster" />}
      <div className="card-info">
        <p className="card-title">{movie.title}</p>
        {movie.release_date && <p className="card-year">{movie.release_date.slice(0, 4)}</p>}
      </div>
    </div>
  )
}

export default function App() {
  const canvasRef = useRef(null)
  const [cake, setCake]               = useState(cakes[0])
  const [ingredients, setIngredients] = useState([])
  const [searchOpen, setSearchOpen]   = useState(false)
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [searchError, setSearchError] = useState('')
  const [phase, setPhase]             = useState('whole')
  const [collagePos, setCollagePos]   = useState([])
  const [isGift, setIsGift]           = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [initLoading, setInitLoading] = useState(false)

  // Load shared cake from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cakeId   = params.get('cake')
    const movieIds = params.get('movies')
    if (!cakeId || !movieIds) return

    const foundCake = cakes.find(c => c.id === parseInt(cakeId))
    if (!foundCake) return

    setCake(foundCake)
    setInitLoading(true)

    const ids = movieIds.split(',').filter(Boolean)
    Promise.all(
      ids.map(id =>
        fetch(`${TMDB_URL}/movie/${id}?api_key=${API_KEY}&language=ko-KR`)
          .then(r => r.json())
          .catch(() => null)
      )
    ).then(movies => {
      const valid = movies.filter(m => m && m.id)
      const W = window.innerWidth
      const H = window.innerHeight
      const placed = []
      const withPos = valid.map(m => {
        const pos = findFreePos(placed, W, H)
        placed.push(pos)
        return { ...m, pos }
      })
      setIngredients(withPos)
      setIsGift(true)
      setPhase('received')
      setInitLoading(false)
    })
  }, [])

  async function doSearch(q) {
    const trimmed = q.trim()
    if (!trimmed) { setResults([]); setSearchError(''); return }
    setLoading(true)
    setSearchError('')
    try {
      const noSpace = trimmed.replace(/\s+/g, '')
      const variants = new Set([trimmed, noSpace])
      if (!trimmed.includes(' ') && noSpace.length >= 3 && noSpace.length <= 12) {
        for (let i = 1; i < noSpace.length; i++) {
          variants.add(noSpace.slice(0, i) + ' ' + noSpace.slice(i))
        }
      }
      const fetches = [...variants].flatMap(qStr => {
        const base = `${TMDB_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(qStr)}`
        return [
          fetch(`${base}&language=ko-KR`).then(r => r.json()),
          fetch(`${base}&language=en-US`).then(r => r.json()),
        ]
      })
      const responses = await Promise.all(fetches)
      const seen = new Set()
      const merged = []
      for (const data of responses) {
        for (const m of (data.results || [])) {
          if (!seen.has(m.id)) { seen.add(m.id); merged.push(m) }
        }
      }
      setResults(merged.slice(0, 12))
      if (merged.length === 0) setSearchError('검색 결과가 없습니다.')
    } catch {
      setSearchError('검색에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchOpen) return
    const timer = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(timer)
  }, [query, searchOpen])

  function searchMovies(e) {
    e.preventDefault()
    doSearch(query)
  }

  const addIngredient = useCallback((movie) => {
    if (ingredients.find(m => m.id === movie.id)) {
      setIngredients(prev => prev.filter(m => m.id !== movie.id))
      return
    }
    if (ingredients.length >= MAX_MOVIES) return
    const pos = findFreePos(ingredients.map(m => m.pos), window.innerWidth, window.innerHeight)
    setIngredients(prev => [...prev, { ...movie, pos }])
  }, [ingredients])

  function removeIngredient(id) {
    setIngredients(prev => prev.filter(m => m.id !== id))
  }

  function handleCut() {
    const W = 340, H = 420
    setCollagePos(genCollagePos(ingredients.length, W - 16, H - 16, 68, 98))
    setPhase('cutting')
  }

  async function handleShare() {
    const params = new URLSearchParams({
      cake:   cake.id,
      movies: ingredients.map(m => m.id).join(','),
    })
    const url = `${window.location.origin}${window.location.pathname}?${params}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    } catch {
      window.prompt('링크를 복사하세요:', url)
    }
  }

  function backToWhole() {
    setPhase('whole')
    setShareCopied(false)
  }

  function reset() {
    window.history.replaceState({}, '', window.location.pathname)
    setPhase('whole')
    setIngredients([])
    setQuery('')
    setResults([])
    setIsGift(false)
    setShareCopied(false)
  }

  function goCreate() {
    window.history.replaceState({}, '', window.location.pathname)
    setCake(cakes[0])
    setPhase('whole')
    setIngredients([])
    setQuery('')
    setResults([])
    setIsGift(false)
    setShareCopied(false)
  }

  function changeCake(c) {
    setCake(c)
    reset()
  }

  const canShare = ingredients.length >= MIN_SHARE

  return (
    <div className="canvas" ref={canvasRef}>

      {/* Loading shared cake */}
      {initLoading && (
        <div className="init-loading">
          <div className="init-loading-inner">
            <p>케이크 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* ── CAKE BACKGROUND ── */}
      {phase !== 'cutting' && !initLoading && (
        <div className="cake-bg-wrap">
          <img key={cake.id} className="cake-bg" src={cake.img} alt=""
               style={cake.yOffset ? { transform: `translateY(${cake.yOffset}vh)` } : undefined} />
          <div className="cake-vignette" />
        </div>
      )}

      {/* ── CAKE SLICE ANIMATION ── */}
      {phase === 'cutting' && (
        <CakeSliceAnimation cake={cake} onComplete={() => setPhase('sliced')} />
      )}

      {/* ── FLOATING MOVIE CARDS ── */}
      {phase === 'whole' && ingredients.map(movie => (
        <MovieCard key={movie.id} movie={movie} onRemove={removeIngredient} />
      ))}

      {/* ── SLICED VIEW ── */}
      {phase === 'sliced' && (
        <div className="slice-modal">
          <div className="cross-section">
            <div className="layer sponge" />
            <div className="layer cream" />
            <div className="layer sponge" />
            <div className="layer cream" />
            <div className="layer sponge" />
            {ingredients.map((movie, i) => {
              const p = collagePos[i]
              if (!p) return null
              return (
                <div key={movie.id} className="collage-poster" style={{ left: p.x, top: p.y, animationDelay: `${i * 75}ms` }}>
                  {movie.poster_path
                    ? <img src={`${POSTER}${movie.poster_path}`} alt={movie.title} />
                    : <div className="collage-fallback">{movie.title[0]}</div>}
                </div>
              )
            })}
          </div>
          <p className="slice-cake-name">{cake.name}</p>
          {isGift
            ? <button className="btn-create" onClick={goCreate}>나도 케이크 만들기 →</button>
            : (
              <div className="slice-actions">
                <button className="btn-reset" onClick={backToWhole}>← 처음으로</button>
                <button className="btn-share" onClick={handleShare}>
                  <GiftIcon /> {shareCopied ? '링크 복사됨 ✓' : '선물하기'}
                </button>
              </div>
            )
          }
        </div>
      )}

      {/* ── LOGO ── */}
      <p className="ui-logo">Slice</p>

      {/* ── CAKE SELECTOR · bottom-left (creator only) ── */}
      {phase === 'whole' && (
        <div className="ui-cake-selector">
          {cakes.map(c => (
            <div key={c.id} className={`cake-mini ${cake.id === c.id ? 'active' : ''}`} onClick={() => changeCake(c)}>
              <img src={c.thumb} alt={c.name} />
            </div>
          ))}
        </div>
      )}

      {/* ── CENTER BUTTONS: 선물 + 자르기 ── */}
      {phase === 'whole' && canShare && (
        <div className="ui-actions">
          <button className="btn-share" onClick={handleShare}>
            <GiftIcon /> {shareCopied ? '링크 복사됨 ✓' : '케이크 선물하기'}
          </button>
          <button className="btn-cut" onClick={handleCut}>
            <KnifeIcon /> 케이크 미리 맛보기
          </button>
        </div>
      )}

      {/* ── RIGHT BUTTON: 영화 추가 ── */}
      {phase === 'whole' && (
        <div className="ui-actions-right">
          <button className="btn-add" onClick={() => setSearchOpen(v => !v)}>
            {searchOpen ? '닫기' : ingredients.length >= MAX_MOVIES ? `${MAX_MOVIES}개 완성` : '영화 추가'}
          </button>
        </div>
      )}

      {/* ── ACTION BUTTONS: recipient ── */}
      {phase === 'received' && !initLoading && (
        <div className="ui-actions">
          <button className="btn-cut received-cut" onClick={handleCut}>
            <KnifeIcon /> 케이크 자르기
          </button>
        </div>
      )}

      {/* ── SEARCH PANEL ── */}
      {searchOpen && phase === 'whole' && (
        <div className="search-panel">
          <form onSubmit={searchMovies} className="sp-form">
            <input className="sp-input" placeholder="영화 제목 검색..." value={query}
              onChange={e => setQuery(e.target.value)} autoFocus />
            <button className="sp-btn" type="submit">검색</button>
          </form>
          {loading && <p className="sp-hint">검색 중...</p>}
          {!loading && searchError && <p className="sp-hint sp-error">{searchError}</p>}
          <div className="sp-results">
            {results.map(movie => {
              const added = ingredients.some(m => m.id === movie.id)
              return (
                <div key={movie.id} className={`sp-item ${added ? 'added' : ''}`} onClick={() => addIngredient(movie)}>
                  {movie.poster_path
                    ? <img className="sp-thumb" src={`${POSTER}${movie.poster_path}`} alt="" />
                    : <div className="sp-thumb no-thumb" />}
                  <div className="sp-info">
                    <p className="sp-title">{movie.title}</p>
                    {movie.release_date && <p className="sp-year">{movie.release_date.slice(0, 4)}</p>}
                  </div>
                  <span className="sp-badge">{added ? '✓' : '+'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
