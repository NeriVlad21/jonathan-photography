export default function EmptyState({ title, body, action }) {
  return (
    <div className="empty-state" role="status">
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  )
}
