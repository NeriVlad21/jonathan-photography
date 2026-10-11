export default function ErrorState({ title = 'Something went wrong.', body, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {onRetry && (
        <button type="button" className="btn btn--ghost-light btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
