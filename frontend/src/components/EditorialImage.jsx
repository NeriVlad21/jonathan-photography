import { imageUrl } from '../utils/format.js'

export default function EditorialImage({ src, alt, caption, style }) {
  return (
    <div className="editorial-image" style={style}>
      <img src={imageUrl(src)} alt={alt || ''} loading="lazy" />
      {caption && <div className="editorial-image__caption">{caption}</div>}
    </div>
  )
}
