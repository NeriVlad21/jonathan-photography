export default function EditorialDoodles({ variant = 'public' }) {
  return (
    <div className={`editorial-doodles editorial-doodles--${variant}`} aria-hidden="true">
      {variant === 'admin' ? (
        <svg className="editorial-doodle editorial-doodle--aperture" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="27" />
          <path d="M40 13 53 35 40 40 27 35Z M67 40 45 53 40 40 45 27Z M40 67 27 45 40 40 53 45Z M13 40 35 27 40 40 35 53Z" />
        </svg>
      ) : (
        <svg className="editorial-doodle editorial-doodle--film" viewBox="0 0 110 46">
          <path d="M5 9h100v28H5zM17 9v28M93 9v28" />
          <path d="M28 15h12v7H28zM49 15h12v7H49zM70 15h12v7H70zM28 25h12v7H28zM49 25h12v7H49zM70 25h12v7H70z" />
        </svg>
      )}
    </div>
  )
}
