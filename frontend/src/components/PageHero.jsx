export default function PageHero({ eyebrow, title, intro, note }) {
  return (
    <header className="page-hero">
      <div className="container">
        <div className="page-hero__topline">
          <span>{eyebrow}</span>
          <span>{note || 'Jonathan Photography'}</span>
        </div>
        <h1>{title}</h1>
        <div className="page-hero__bottom">
          <p>{intro}</p>
          <span aria-hidden="true">↘</span>
        </div>
      </div>
    </header>
  )
}
