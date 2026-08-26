export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}
