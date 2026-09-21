import { useEffect, useState } from 'react'
import { ImageUp, Plus, Save, Trash2 } from 'lucide-react'
import { assetUrl, portfolioApi, siteContentApi } from '../services/api.js'
import { DEFAULT_SITE_CONTENT, mergeSiteContent } from '../content/defaultSiteContent.js'
import { useToast } from '../context/ToastContext.jsx'

const FAQ_MIN = 3
const FAQ_MAX = 12
const CONTENT_TABS = [
  { id: 'home', label: 'Home & About', description: 'Hero, introduction and homepage sections' },
  { id: 'music', label: 'Music', description: 'Playlist heading and songs' },
  { id: 'faq', label: 'FAQ', description: 'Questions and answers' },
  { id: 'services', label: 'Services', description: 'Page labels and service groups' },
  { id: 'contact', label: 'Contact & Footer', description: 'Contact page and footer copy' },
  { id: 'pages', label: 'Portfolio & Booking', description: 'Work page and booking guidance' }
]

function Field({ label, value, onChange, maxLength = 160, multiline = false, help }) {
  const Tag = multiline ? 'textarea' : 'input'
  return <label className="cms-field"><span>{label}</span>{help && <small>{help}</small>}<Tag value={value || ''} maxLength={maxLength} rows={multiline ? 4 : undefined} onChange={(event) => onChange(event.target.value)} /><em>{String(value || '').length}/{maxLength}</em></label>
}

export default function SiteContentManager() {
  const { showToast } = useToast()
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT)
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [homePanel, setHomePanel] = useState('hero')
  const [pagePanel, setPagePanel] = useState('portfolio')

  useEffect(() => {
    Promise.all([siteContentApi.get(), portfolioApi.categories(true)])
      .then(([data, rows]) => { setContent(mergeSiteContent(data?.content)); setCategories(rows || []) })
      .catch(() => showToast('Some website content could not be loaded.', 'error'))
  }, [showToast])

  const set = (path, value) => setContent((current) => {
    const next = structuredClone(current)
    const keys = path.split('.')
    let target = next
    keys.slice(0, -1).forEach((key) => { target = target[key] })
    target[keys.at(-1)] = value
    return next
  })

  const save = async () => {
    setSaving(true)
    try {
      const result = await siteContentApi.update(content)
      setContent(mergeSiteContent(result.content))
      showToast('Public website content updated.')
    } catch (error) { showToast(error.message || 'Content could not be saved.', 'error') }
    finally { setSaving(false) }
  }

  const uploadHero = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData(); body.append('image', file)
      const result = await siteContentApi.uploadImage(body)
      set('hero.image', result.path)
      showToast('Hero image uploaded. Save changes to publish it.')
    } catch (error) { showToast(error.message || 'Image could not be uploaded.', 'error') }
    finally { setUploading(false) }
  }

  const updateArrayItem = (path, index, key, value) => {
    const items = structuredClone(path.split('.').reduce((obj, part) => obj[part], content))
    items[index][key] = value
    set(path, items)
  }
  const removeItem = (path, index) => set(path, path.split('.').reduce((obj, part) => obj[part], content).filter((_, i) => i !== index))

  return <div className={`cms-page cms-page--${activeTab}`}>
    <nav className="cms-tabs" aria-label="Website content sections">
      <span className="cms-tabs__title">Choose a section</span>
      {CONTENT_TABS.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}><strong>{tab.label}</strong><small>{tab.description}</small></button>)}
      <button type="button" className="cms-tabs__save" onClick={save} disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button>
    </nav>

    <style>{`
      .cms-page[class*="cms-page--"]{width:100%;max-width:1440px;margin:0 auto;padding:clamp(20px,2.6vw,36px)}
      .cms-tabs{position:sticky;top:92px;z-index:20;display:flex;flex-direction:column;gap:6px;align-self:start;padding:14px;background:#fff;border:1px solid #ddd9cf;border-radius:18px;box-shadow:0 8px 24px rgba(30,27,20,.06)}
      .cms-tabs__title{padding:5px 10px 9px;color:#8a857b;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
      .cms-tabs button{border:0;border-radius:12px;background:transparent;padding:12px;font:inherit;color:#69655d;cursor:pointer;text-align:left}
      .cms-tabs button strong,.cms-tabs button small{display:block}.cms-tabs button strong{font-size:.95rem}.cms-tabs button small{margin-top:4px;color:inherit;font-size:.72rem;font-weight:500;line-height:1.3;opacity:.72}
      .cms-tabs button:hover{background:#ebe8df;color:#111}
      .cms-tabs button.is-active{background:#111;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.14)}
      .cms-tabs .cms-tabs__save{display:inline-flex;align-items:center;justify-content:center;gap:7px;margin-top:8px;background:#f5cf00;color:#111;text-align:center;font-weight:800}
      .cms-card{display:none}
      .cms-card.is-active{display:block}
      .cms-subtabs{display:flex;gap:6px;padding:6px;background:#e9e6dd;border-radius:14px}.cms-subtabs button{flex:1;border:0;border-radius:10px;background:transparent;padding:10px 12px;font:inherit;font-weight:750;color:#706b62;cursor:pointer}.cms-subtabs button.is-active{background:#fff;color:#111;box-shadow:0 3px 10px rgba(30,27,20,.08)}
      .cms-page .cms-card{padding:24px;border-radius:16px}.cms-page .cms-card h2{margin-bottom:16px}.cms-page .cms-grid{gap:14px}.cms-page .cms-field{gap:5px}.cms-page .cms-field input,.cms-page .cms-field textarea{padding:10px 12px}.cms-page .cms-upload{margin-top:16px}
      @media(min-width:1000px){.cms-page[class*="cms-page--"]{grid-template-columns:250px minmax(0,1fr);align-items:start;gap:24px}.cms-page .cms-tabs{grid-column:1;grid-row:1/span 20}.cms-page .cms-card,.cms-page .cms-subtabs{grid-column:2}.cms-page .cms-card{max-height:none;overflow:visible}}
      @media(max-width:999px){.cms-page[class*="cms-page--"]{padding:20px}.cms-tabs{top:72px;flex-direction:row;overflow-x:auto;padding:9px}.cms-tabs__title{display:none}.cms-tabs button{flex:0 0 auto;padding:10px 13px;white-space:nowrap}.cms-tabs button small{display:none}.cms-tabs .cms-tabs__save{margin:0 0 0 auto}.cms-page .cms-card{max-height:none;overflow:visible}}
      @media(min-width:761px) and (max-width:900px){.cms-page .cms-grid,.cms-page .cms-repeat__row,.cms-page .cms-repeat__row--faq{grid-template-columns:1fr}.cms-page .cms-repeat__row>button{margin:0}}
      @media(max-width:600px){.cms-page[class*="cms-page--"]{padding:14px 14px 92px;gap:14px}.cms-tabs{top:70px;margin-inline:-4px}.cms-tabs .cms-tabs__save{position:fixed;right:14px;bottom:14px;z-index:100;margin:0;padding:14px 18px;box-shadow:0 10px 30px rgba(17,17,15,.25)}.cms-subtabs{overflow-x:auto}.cms-subtabs button{flex:0 0 auto;min-width:max-content}.cms-page .cms-card{padding:18px}.cms-page .cms-card h2{font-size:1.25rem}.cms-page .cms-grid{gap:12px}}
    `}</style>

    {activeTab === 'home' && <nav className="cms-subtabs" aria-label="Home page areas"><button type="button" className={homePanel === 'hero' ? 'is-active' : ''} onClick={() => setHomePanel('hero')}>Hero & brand</button><button type="button" className={homePanel === 'about' ? 'is-active' : ''} onClick={() => setHomePanel('about')}>Introduction & about</button><button type="button" className={homePanel === 'sections' ? 'is-active' : ''} onClick={() => setHomePanel('sections')}>Homepage sections</button></nav>}
    {activeTab === 'pages' && <nav className="cms-subtabs" aria-label="Portfolio and booking areas"><button type="button" className={pagePanel === 'portfolio' ? 'is-active' : ''} onClick={() => setPagePanel('portfolio')}>Portfolio page</button><button type="button" className={pagePanel === 'booking' ? 'is-active' : ''} onClick={() => setPagePanel('booking')}>Booking page</button></nav>}

    <section className={`cms-card cms-card--compact ${activeTab === 'music' ? 'is-active' : ''}`}><h2>Music section labels</h2><div className="cms-grid"><Field label="Playlist eyebrow" value={content.music.eyebrow} maxLength={50} onChange={(v) => set('music.eyebrow', v)} /></div></section>

    <section className={`cms-card cms-card--compact ${activeTab === 'faq' ? 'is-active' : ''}`}><h2>FAQ section labels</h2><div className="cms-grid"><Field label="FAQ eyebrow" value={content.faq.eyebrow} maxLength={40} onChange={(v) => set('faq.eyebrow', v)} /></div></section>

    <section className={`cms-card cms-card--compact ${activeTab === 'services' ? 'is-active' : ''}`}><h2>Services page labels</h2><div className="cms-grid"><Field label="Services page eyebrow" value={content.servicesPage.eyebrow} maxLength={60} onChange={(v) => set('servicesPage.eyebrow', v)} /><Field label="Services page button" value={content.servicesPage.buttonLabel} maxLength={60} onChange={(v) => set('servicesPage.buttonLabel', v)} /></div></section>

    <section className={`cms-card ${activeTab === 'home' && homePanel === 'hero' ? 'is-active' : ''}`}><h2>Brand & hero</h2><div className="cms-grid">
      <Field label="Brand name" value={content.brand.name} maxLength={30} onChange={(v) => set('brand.name', v)} />
      <Field label="Brand accent" value={content.brand.accent} maxLength={30} onChange={(v) => set('brand.accent', v)} />
      <Field label="Studio address" value={content.brand.address} maxLength={220} multiline onChange={(v) => set('brand.address', v)} />
      <Field label="Hero eyebrow" value={content.hero.eyebrow} maxLength={70} onChange={(v) => set('hero.eyebrow', v)} />
      <Field label="Hero title" value={content.hero.title} maxLength={90} multiline help="Use one line break where you want the title to wrap." onChange={(v) => set('hero.title', v)} />
      <Field label="Hero description" value={content.hero.subtitle} maxLength={240} multiline onChange={(v) => set('hero.subtitle', v)} />
      <Field label="Hero primary button" value={content.hero.primaryLabel} maxLength={45} onChange={(v) => set('hero.primaryLabel', v)} />
      <Field label="Hero booking link" value={content.hero.secondaryLabel} maxLength={45} onChange={(v) => set('hero.secondaryLabel', v)} />
      <Field label="Image description" value={content.hero.imageAlt} maxLength={160} onChange={(v) => set('hero.imageAlt', v)} />
      <Field label="Location line" value={content.hero.location} maxLength={60} onChange={(v) => set('hero.location', v)} />
      <Field label="Availability line" value={content.hero.availability} maxLength={80} onChange={(v) => set('hero.availability', v)} />
    </div><div className="cms-upload"><img src={assetUrl(content.hero.image)} alt="Current hero" /><label className="btn btn--outline"><ImageUp size={17} />{uploading ? 'Uploading…' : 'Replace hero image'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={(e) => uploadHero(e.target.files?.[0])} /></label></div></section>

    <section className={`cms-card ${activeTab === 'home' && homePanel === 'about' ? 'is-active' : ''}`}><h2>Homepage introduction & About</h2><div className="cms-grid">
      <Field label="Opening statement" value={content.introduction.statement} maxLength={90} onChange={(v) => set('introduction.statement', v)} />
      <Field label="Opening emphasis" value={content.introduction.emphasis} maxLength={90} onChange={(v) => set('introduction.emphasis', v)} />
      <Field label="Introduction link" value={content.introduction.linkLabel} maxLength={55} onChange={(v) => set('introduction.linkLabel', v)} />
      {content.introduction.paragraphs.map((value, index) => <Field key={index} label={`Introduction paragraph ${index + 1}`} value={value} maxLength={600} multiline onChange={(v) => { const a = [...content.introduction.paragraphs]; a[index] = v; set('introduction.paragraphs', a) }} />)}
      <Field label="Who I am label" value={content.about.whoLabel} maxLength={40} onChange={(v) => set('about.whoLabel', v)} />
      {content.about.whoParagraphs.map((value, index) => <Field key={index} label={`Who I am paragraph ${index + 1}`} value={value} maxLength={900} multiline onChange={(v) => { const a = [...content.about.whoParagraphs]; a[index] = v; set('about.whoParagraphs', a) }} />)}
      <Field label="Skills label" value={content.about.skillsLabel} maxLength={40} onChange={(v) => set('about.skillsLabel', v)} />
      <Field label="Skills (one per line)" value={content.about.skills.join('\n')} maxLength={240} multiline onChange={(v) => set('about.skills', v.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8))} />
      <Field label="Location label" value={content.about.locationLabel} maxLength={50} onChange={(v) => set('about.locationLabel', v)} />
      <Field label="Location story" value={content.about.locationText} maxLength={900} multiline onChange={(v) => set('about.locationText', v)} />
      <Field label="About link" value={content.about.linkLabel} maxLength={70} onChange={(v) => set('about.linkLabel', v)} />
    </div></section>

    <section className={`cms-card ${activeTab === 'home' && homePanel === 'sections' ? 'is-active' : ''}`}><h2>Homepage section headings</h2><div className="cms-grid">
      <Field label="Selected work eyebrow" value={content.selectedWork.eyebrow} maxLength={50} onChange={(v) => set('selectedWork.eyebrow', v)} />
      <Field label="Selected work heading" value={content.selectedWork.title} maxLength={80} onChange={(v) => set('selectedWork.title', v)} />
      <Field label="Selected work description" value={content.selectedWork.description} maxLength={240} multiline onChange={(v) => set('selectedWork.description', v)} />
      <Field label="Selected work link" value={content.selectedWork.linkLabel} maxLength={45} onChange={(v) => set('selectedWork.linkLabel', v)} />
      <Field label="Services eyebrow" value={content.servicesHome.eyebrow} maxLength={50} onChange={(v) => set('servicesHome.eyebrow', v)} />
      <Field label="Services heading" value={content.servicesHome.title} maxLength={100} onChange={(v) => set('servicesHome.title', v)} />
      <Field label="Services link" value={content.servicesHome.linkLabel} maxLength={50} onChange={(v) => set('servicesHome.linkLabel', v)} />
      <Field label="Estimator eyebrow" value={content.estimatorCta.eyebrow} maxLength={50} onChange={(v) => set('estimatorCta.eyebrow', v)} />
      <Field label="Estimator heading" value={content.estimatorCta.title} maxLength={120} multiline onChange={(v) => set('estimatorCta.title', v)} />
      <Field label="Estimator button" value={content.estimatorCta.buttonLabel} maxLength={55} onChange={(v) => set('estimatorCta.buttonLabel', v)} />
    </div><fieldset className="cms-checks"><legend>Selected work categories (up to 4)</legend>{categories.map((category) => { const chosen = content.selectedWork.categorySlugs.includes(category.slug); return <label key={category.id}><input type="checkbox" checked={chosen} disabled={!chosen && content.selectedWork.categorySlugs.length >= 4} onChange={() => set('selectedWork.categorySlugs', chosen ? content.selectedWork.categorySlugs.filter((x) => x !== category.slug) : [...content.selectedWork.categorySlugs, category.slug])} />{category.name}</label> })}</fieldset></section>

    <section className={`cms-card ${activeTab === 'music' ? 'is-active' : ''}`}><div className="cms-card__head"><div><h2>Playlist</h2><p>Use a YouTube video ID, not a full URL. The floating player updates automatically.</p></div><button className="btn btn--outline" disabled={content.music.songs.length >= 20} onClick={() => set('music.songs', [...content.music.songs, { title: '', artist: '', youtubeId: '' }])}><Plus size={16} /> Add song</button></div><div className="cms-grid"><Field label="Playlist heading" value={content.music.title} maxLength={90} onChange={(v) => set('music.title', v)} /><Field label="Playlist description" value={content.music.description} maxLength={240} multiline onChange={(v) => set('music.description', v)} /></div><div className="cms-repeat">{content.music.songs.map((song, index) => <div className="cms-repeat__row" key={`${index}-${song.youtubeId}`}><Field label="Song" value={song.title} maxLength={100} onChange={(v) => updateArrayItem('music.songs', index, 'title', v)} /><Field label="Artist" value={song.artist} maxLength={100} onChange={(v) => updateArrayItem('music.songs', index, 'artist', v)} /><Field label="YouTube ID" value={song.youtubeId} maxLength={20} onChange={(v) => updateArrayItem('music.songs', index, 'youtubeId', v)} /><button aria-label="Remove song" disabled={content.music.songs.length <= 1} onClick={() => removeItem('music.songs', index)}><Trash2 size={18} /></button></div>)}</div></section>

    <section className={`cms-card ${activeTab === 'faq' ? 'is-active' : ''}`}><div className="cms-card__head"><div><h2>Frequently asked questions</h2><p>Minimum {FAQ_MIN}, maximum {FAQ_MAX}. Length limits protect the mobile layout.</p></div><button className="btn btn--outline" disabled={content.faq.items.length >= FAQ_MAX} onClick={() => set('faq.items', [...content.faq.items, { question: '', answer: '' }])}><Plus size={16} /> Add FAQ</button></div><div className="cms-grid"><Field label="FAQ heading" value={content.faq.title} maxLength={90} onChange={(v) => set('faq.title', v)} /></div><div className="cms-repeat">{content.faq.items.map((item, index) => <div className="cms-repeat__row cms-repeat__row--faq" key={index}><Field label={`Question ${index + 1}`} value={item.question} maxLength={160} onChange={(v) => updateArrayItem('faq.items', index, 'question', v)} /><Field label="Answer" value={item.answer} maxLength={700} multiline onChange={(v) => updateArrayItem('faq.items', index, 'answer', v)} /><button aria-label="Remove FAQ" disabled={content.faq.items.length <= FAQ_MIN} onClick={() => removeItem('faq.items', index)}><Trash2 size={18} /></button></div>)}</div></section>

    <section className={`cms-card ${activeTab === 'services' ? 'is-active' : ''}`}><h2>Services page & connected sections</h2><p>Section keys are used by the Services editor and estimator. Use lowercase words such as <code>photography</code>.</p><div className="cms-grid"><Field label="Page title" value={content.servicesPage.title} maxLength={100} onChange={(v) => set('servicesPage.title', v)} /><Field label="Page introduction" value={content.servicesPage.intro} maxLength={360} multiline onChange={(v) => set('servicesPage.intro', v)} /><Field label="Page note" value={content.servicesPage.note} maxLength={60} onChange={(v) => set('servicesPage.note', v)} /></div><div className="cms-repeat">{content.servicesPage.categories.map((item, index) => <div className="cms-repeat__row" key={index}><Field label="Section key" value={item.key} maxLength={30} onChange={(v) => updateArrayItem('servicesPage.categories', index, 'key', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /><Field label="Public section name" value={item.label} maxLength={70} onChange={(v) => updateArrayItem('servicesPage.categories', index, 'label', v)} /><button aria-label="Remove section" disabled={content.servicesPage.categories.length <= 1} onClick={() => removeItem('servicesPage.categories', index)}><Trash2 size={18} /></button></div>)}</div><button className="btn btn--outline" disabled={content.servicesPage.categories.length >= 12} onClick={() => set('servicesPage.categories', [...content.servicesPage.categories, { key: `section-${content.servicesPage.categories.length + 1}`, label: 'New service section' }])}><Plus size={16} /> Add service section</button></section>

    <section className={`cms-card ${activeTab === 'contact' ? 'is-active' : ''}`}><h2>Contact page & footer</h2><div className="cms-grid">
      <Field label="Contact page eyebrow" value={content.contactPage.eyebrow} maxLength={60} onChange={(v) => set('contactPage.eyebrow', v)} />
      <Field label="Contact page title" value={content.contactPage.title} maxLength={100} onChange={(v) => set('contactPage.title', v)} />
      <Field label="Contact introduction" value={content.contactPage.intro} maxLength={360} multiline onChange={(v) => set('contactPage.intro', v)} />
      <Field label="Response note" value={content.contactPage.note} maxLength={80} onChange={(v) => set('contactPage.note', v)} />
      <Field label="Footer call to action" value={content.footer.ctaTitle} maxLength={90} onChange={(v) => set('footer.ctaTitle', v)} />
      <Field label="Footer button" value={content.footer.ctaButton} maxLength={50} onChange={(v) => set('footer.ctaButton', v)} />
      <Field label="Explore heading" value={content.footer.exploreTitle} maxLength={35} onChange={(v) => set('footer.exploreTitle', v)} />
      <Field label="Connect heading" value={content.footer.connectTitle} maxLength={35} onChange={(v) => set('footer.connectTitle', v)} />
      <Field label="Studio heading" value={content.footer.studioTitle} maxLength={35} onChange={(v) => set('footer.studioTitle', v)} />
      <Field label="Copyright name" value={content.footer.copyright} maxLength={100} onChange={(v) => set('footer.copyright', v)} />
      <Field label="Footer location" value={content.footer.location} maxLength={80} onChange={(v) => set('footer.location', v)} />
    </div></section>

    <section className={`cms-card ${activeTab === 'pages' && pagePanel === 'portfolio' ? 'is-active' : ''}`}><h2>Portfolio page copy</h2><div className="cms-grid">
      <Field label="Portfolio kicker" value={content.portfolioPage.kicker} maxLength={50} onChange={(v) => set('portfolioPage.kicker', v)} />
      <Field label="Portfolio title" value={content.portfolioPage.title} maxLength={100} onChange={(v) => set('portfolioPage.title', v)} />
      <Field label="Portfolio introduction" value={content.portfolioPage.intro} maxLength={240} multiline onChange={(v) => set('portfolioPage.intro', v)} />
      <Field label="Collection eyebrow" value={content.portfolioPage.indexEyebrow} maxLength={50} onChange={(v) => set('portfolioPage.indexEyebrow', v)} />
      <Field label="Collection heading" value={content.portfolioPage.indexTitle} maxLength={80} onChange={(v) => set('portfolioPage.indexTitle', v)} />
      <Field label="Collection description" value={content.portfolioPage.indexText} maxLength={240} multiline onChange={(v) => set('portfolioPage.indexText', v)} />
    </div></section>

    <section className={`cms-card ${activeTab === 'pages' && pagePanel === 'booking' ? 'is-active' : ''}`}><h2>Booking page copy</h2><div className="cms-grid">
      <Field label="Booking eyebrow" value={content.bookingPage.eyebrow} maxLength={60} onChange={(v) => set('bookingPage.eyebrow', v)} />
      <Field label="Estimator title" value={content.bookingPage.estimateTitle} maxLength={110} onChange={(v) => set('bookingPage.estimateTitle', v)} />
      <Field label="Booking request title" value={content.bookingPage.requestTitle} maxLength={110} onChange={(v) => set('bookingPage.requestTitle', v)} />
      <Field label="Estimator introduction" value={content.bookingPage.estimateIntro} maxLength={420} multiline onChange={(v) => set('bookingPage.estimateIntro', v)} />
      <Field label="Request introduction" value={content.bookingPage.requestIntro} maxLength={420} multiline onChange={(v) => set('bookingPage.requestIntro', v)} />
      <Field label="Workflow eyebrow" value={content.bookingPage.workflowEyebrow} maxLength={50} onChange={(v) => set('bookingPage.workflowEyebrow', v)} />
      <Field label="Workflow heading" value={content.bookingPage.workflowTitle} maxLength={110} onChange={(v) => set('bookingPage.workflowTitle', v)} />
      <Field label="Workflow explanation" value={content.bookingPage.workflowIntro} maxLength={520} multiline onChange={(v) => set('bookingPage.workflowIntro', v)} />
      {content.bookingPage.steps.map((step, index) => <div key={index} className="cms-subgroup"><Field label={`Step ${index + 1} title`} value={step.title} maxLength={70} onChange={(v) => updateArrayItem('bookingPage.steps', index, 'title', v)} /><Field label={`Step ${index + 1} explanation`} value={step.text} maxLength={360} multiline onChange={(v) => updateArrayItem('bookingPage.steps', index, 'text', v)} /></div>)}
      <Field label="Booking notice" value={content.bookingPage.notice} maxLength={520} multiline onChange={(v) => set('bookingPage.notice', v)} />
    </div></section>

    <style>{`.cms-page{display:grid;gap:24px;max-width:1180px}.cms-header,.cms-card__head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.cms-header h1{font-size:clamp(2rem,4vw,3.25rem);margin:6px 0}.cms-header p,.cms-card p{color:#6b6861}.cms-card{background:#fff;border:1px solid #ddd9cf;border-radius:20px;padding:clamp(20px,3vw,34px);box-shadow:0 10px 35px rgba(30,27,20,.05)}.cms-card h2{font-size:1.45rem;margin:0 0 20px}.cms-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.cms-subgroup{display:grid;gap:10px;padding:14px;background:#f5f3ed;border-radius:14px}.cms-field{display:grid;gap:7px;position:relative}.cms-field>span{font-weight:750}.cms-field small{color:#716d65}.cms-field input,.cms-field textarea{width:100%;border:1px solid #c9c4ba;border-radius:10px;padding:12px 14px;font:inherit;background:#faf9f5;resize:vertical}.cms-field em{font-size:.72rem;color:#888;font-style:normal;text-align:right}.cms-upload{display:flex;gap:16px;align-items:center;margin-top:20px}.cms-upload img{width:160px;aspect-ratio:16/10;object-fit:cover;border-radius:12px}.cms-repeat{display:grid;gap:12px;margin:18px 0}.cms-repeat__row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end;padding:14px;background:#f5f3ed;border-radius:14px}.cms-repeat__row--faq{grid-template-columns:1fr 2fr auto}.cms-repeat__row>button{width:42px;height:42px;border:1px solid #d7d2c8;border-radius:50%;background:#fff;display:grid;place-items:center;margin-bottom:24px}.cms-checks{border:1px solid #ddd8ce;border-radius:12px;padding:16px;margin-top:20px;display:flex;gap:16px;flex-wrap:wrap}.cms-checks label{display:flex;gap:8px;align-items:center}.cms-page .btn{display:inline-flex;gap:8px;align-items:center;justify-content:center}@media(max-width:760px){.cms-header,.cms-card__head{display:grid}.cms-header .btn{width:100%}.cms-grid,.cms-repeat__row,.cms-repeat__row--faq{grid-template-columns:1fr}.cms-repeat__row>button{margin:0}.cms-upload{align-items:stretch;flex-direction:column}.cms-upload img{width:100%}}`}</style>
  </div>
}
