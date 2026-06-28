import { useState, useRef, useCallback } from 'react'
import './App.css'

const API_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_URL = 'https://api.themoviedb.org/3'
const POSTER   = 'https://image.tmdb.org/t/p/w185'

const CARD_W = 204
const CARD_H = 82

const cakes = [
  { id: 1, name: '체리 화이트', img: '/ch_h.png',  thumb: '/ch_h.png'  },
  { id: 2, name: '초콜릿',      img: '/cho_h.png', thumb: '/cho_h.png' },
  { id: 3, name: '딸기',        img: '/sb_h.png',  thumb: '/sb_h.png'  },
]

function findFreePos(existing, cW, cH) {
  const gap = 16, margin = 80
  for (let t = 0; t < 400; t++) {
    const x = margin + Math.random() * (cW - CARD_W - margin * 2)
    const y = margin + Math.random() * (cH - CARD_H - margin * 2 - 80)
    const ok = !existing.some(
      p => x < p.x + p.w + gap && x + CARD_W + gap > p.x && y < p.y + p.h + gap && y + CARD_H + gap > p.y
    )
    if (ok) return { x, y, w: CARD_W, h: CARD_H }
  }
  const i = existing.length
  return { x: margin + (i % 3) * (CARD_W + gap), y: margin + Math.floor(i / 3) * (CARD_H + gap), w: CARD_W, h: CARD_H }
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
  const canvasRef   = useRef(null)
  const [cake, setCake]           = useState(cakes[0])
  const [ingredients, setIngredients] = useState([])
  const [searchOpen, setSearchOpen]   = useState(false)
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [searchError, setSearchError] = useState('')
  const [phase, setPhase]             = useState('whole')
  const [collagePos, setCollagePos]   = useState([])

  async function searchMovies(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearchError('')
    try {
      const base = `${TMDB_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query.trim())}`
      const [r1, r2] = await Promise.all([
        fetch(`${base}&language=ko-KR`).then(r => r.json()),
        fetch(`${base}&language=en-US`).then(r => r.json()),
      ])
      const seen = new Set()
      const merged = []
      for (const m of [...(r1.results || []), ...(r2.results || [])]) {
        if (!seen.has(m.id)) { seen.add(m.id); merged.push(m) }
      }
      setResults(merged.slice(0, 12))
      if (merged.length === 0) setSearchError('검색 결과가 없습니다.')
    } catch {
      setSearchError('검색에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = useCallback((movie) => {
    if (ingredients.find(m => m.id === movie.id)) return
    const el  = canvasRef.current
    const pos = findFreePos(ingredients.map(m => m.pos), el?.offsetWidth || 900, el?.offsetHeight || 600)
    setIngredients(prev => [...prev, { ...movie, pos }])
  }, [ingredients])

  function removeIngredient(id) {
    setIngredients(prev => prev.filter(m => m.id !== id))
  }

  function handleCut() {
    const W = 340, H = 420
    setCollagePos(genCollagePos(ingredients.length, W - 16, H - 16, 68, 98))
    setPhase('cutting')
    setTimeout(() => setPhase('sliced'), 900)
  }

  function reset() {
    setPhase('whole'); setIngredients([]); setQuery(''); setResults([])
  }

  function changeCake(c) {
    setCake(c); reset()
  }

  return (
    <div className="canvas" ref={canvasRef}>

      {/* ── CAKE BACKGROUND ── */}
      <div className="cake-bg-wrap">
        <img key={cake.id} className="cake-bg" src={cake.img} alt="" />
        <div className="cake-vignette" />
      </div>

      {/* ── FLOATING MOVIE CARDS ── */}
      {phase !== 'sliced' && ingredients.map(movie => (
        <MovieCard key={movie.id} movie={movie} onRemove={phase === 'whole' ? removeIngredient : () => {}} />
      ))}

      {/* ── CUTTING LINE ── */}
      {phase === 'cutting' && <div className="cut-line" />}

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
          <button className="btn-reset" onClick={reset}>← 처음으로</button>
        </div>
      )}

      {/* ── LOGO ── */}
      <p className="ui-logo">Slice</p>

      {/* ── CAKE SELECTOR · bottom-left ── */}
      <div className="ui-cake-selector">
        {cakes.map(c => (
          <div key={c.id} className={`cake-mini ${cake.id === c.id ? 'active' : ''}`} onClick={() => changeCake(c)}>
            <img src={c.thumb} alt={c.name} />
          </div>
        ))}
      </div>

      {/* ── ACTION BUTTONS · bottom-right ── */}
      {phase === 'whole' && (
        <div className="ui-actions">
          {ingredients.length >= 4 && (
            <button className="btn-cut" onClick={handleCut}>
              <KnifeIcon /> 케이크 자르기
            </button>
          )}
          <button className="btn-add" onClick={() => setSearchOpen(v => !v)}>
            {searchOpen ? '닫기' : '영화 추가'}
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
