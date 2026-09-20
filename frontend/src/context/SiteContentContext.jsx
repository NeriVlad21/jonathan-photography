import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { siteContentApi } from '../services/api.js'
import { DEFAULT_SITE_CONTENT, mergeSiteContent } from '../content/defaultSiteContent.js'

const SiteContentContext = createContext(DEFAULT_SITE_CONTENT)

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT)

  useEffect(() => {
    let active = true
    siteContentApi.get()
      .then((data) => { if (active) setContent(mergeSiteContent(data?.content)) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const value = useMemo(() => content, [content])
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  return useContext(SiteContentContext)
}
