import { useEffect } from 'react'

const PROTECTED_MEDIA_SELECTOR =
  '.public-shell img:not([data-download-allowed]), ' +
  '.public-shell video:not([data-download-allowed]), ' +
  '.public-shell canvas:not([data-download-allowed])'

export default function PublicMediaProtection() {
  useEffect(() => {
    const protectElement = (element) => {
      if (!(element instanceof HTMLElement) || !element.matches(PROTECTED_MEDIA_SELECTOR)) return
      element.setAttribute('draggable', 'false')
      element.setAttribute('data-public-preview', 'true')
    }

    const protectTree = (root) => {
      if (!(root instanceof Element) && root !== document) return
      if (root instanceof Element) protectElement(root)
      root.querySelectorAll?.(PROTECTED_MEDIA_SELECTOR).forEach(protectElement)
    }

    const blockMediaAction = (event) => {
      if (event.target instanceof Element && event.target.closest(PROTECTED_MEDIA_SELECTOR)) {
        event.preventDefault()
      }
    }

    protectTree(document)

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) protectTree(node)
        })
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('contextmenu', blockMediaAction, true)
    document.addEventListener('dragstart', blockMediaAction, true)

    return () => {
      observer.disconnect()
      document.removeEventListener('contextmenu', blockMediaAction, true)
      document.removeEventListener('dragstart', blockMediaAction, true)
    }
  }, [])

  return null
}
