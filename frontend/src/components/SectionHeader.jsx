export default function SectionHeader({ eyebrow, title, desc, action }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="display section-header__title">{title}</h2>
        {desc && <p className="section-header__desc">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
