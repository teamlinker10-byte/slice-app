import { useState } from 'react'
import './CakeSelector.css'

const cakes = [
  {
    id: 1,
    name: '클래식 화이트 케이크',
    desc: '부드러운 바닐라 크림과 신선한 딸기',
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
    thumb: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&h=200&q=70',
  },
  {
    id: 2,
    name: '초콜릿 가나슈',
    desc: '진한 벨기에 초콜릿 레이어 케이크',
    img: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80',
    thumb: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=200&h=200&q=70',
  },
  {
    id: 3,
    name: '레몬 시폰',
    desc: '상큼한 레몬 커드와 이탈리안 머랭',
    img: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80',
    thumb: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=200&h=200&q=70',
  },
  {
    id: 4,
    name: '딸기 쇼트케이크',
    desc: '촉촉한 제누아즈와 생크림',
    img: 'https://images.unsplash.com/photo-1488477181946-f4c5ee2cf9e9?auto=format&fit=crop&w=900&q=80',
    thumb: 'https://images.unsplash.com/photo-1488477181946-f4c5ee2cf9e9?auto=format&fit=crop&w=200&h=200&q=70',
  },
  {
    id: 5,
    name: '말차 오페라',
    desc: '일본산 말차와 화이트 초콜릿 무스',
    img: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80',
    thumb: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=200&h=200&q=70',
  },
  {
    id: 6,
    name: '카라멜 솔트',
    desc: '플뢰르 드 셀과 버터 카라멜',
    img: 'https://images.unsplash.com/photo-1570145820259-b5f397cbf8a9?auto=format&fit=crop&w=900&q=80',
    thumb: 'https://images.unsplash.com/photo-1570145820259-b5f397cbf8a9?auto=format&fit=crop&w=200&h=200&q=70',
  },
]

export default function CakeSelector() {
  const [featured, setFeatured] = useState(cakes[0])
  const [selected, setSelected] = useState(new Set())

  function handleThumbClick(cake) {
    setFeatured(cake)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(cake.id)) next.delete(cake.id)
      else next.add(cake.id)
      return next
    })
  }

  return (
    <div className="cake-page">
      <p className="cake-logo">Slice</p>

      <div className="cake-layout">
        <div className="cake-hero">
          <img
            key={featured.id}
            src={featured.img}
            alt={featured.name}
            className="cake-hero-img"
          />
          <div className="cake-overlay-card">
            <p className="overlay-label">케이크를 골라보세요</p>
            <h2>{featured.name}</h2>
            <p className="overlay-desc">{featured.desc}</p>
          </div>
        </div>

        <div className="cake-strip">
          {cakes.map(cake => (
            <div
              key={cake.id}
              className={`cake-thumb ${featured.id === cake.id ? 'active' : ''} ${selected.has(cake.id) ? 'picked' : ''}`}
              onClick={() => handleThumbClick(cake)}
            >
              <img src={cake.thumb} alt={cake.name} />
              {selected.has(cake.id) && <span className="check-badge">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="cake-footer">
          <span className="footer-count">{selected.size}개 선택됨</span>
          <button className="done-btn">선택 완료</button>
        </div>
      )}
    </div>
  )
}
