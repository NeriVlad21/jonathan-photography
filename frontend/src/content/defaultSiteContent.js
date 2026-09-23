export const DEFAULT_SITE_CONTENT = {
  brand: { name: 'jonathan', accent: 'photography', address: '0013 Mc Arthur Hi-way, Brgy. Asan Norte, Sison, Pangasinan' },
  navigation: { work: 'Work', services: 'Services', about: 'About', contact: 'Contact', booking: 'Book a session' },
  hero: {
    image: '/demo/portfolio/weddings/01.jpg',
    imageAlt: 'Newlyweds standing together in a mountain landscape',
    eyebrow: 'Digital photo + video coverage',
    title: 'Stories worth\nkeeping.',
    subtitle: 'Honest photographs of weddings, portraits, and the people at the center of them.',
    primaryLabel: 'Explore the work',
    secondaryLabel: 'Start a booking ↗',
    location: 'Based in Pangasinan',
    availability: 'Available for stories everywhere'
  },
  introduction: {
    statement: 'The day moves quickly.',
    emphasis: 'The photographs should not.',
    paragraphs: [
      'A photograph is the part of a day that gets to happen twice—once when it is lived, and again whenever someone returns to it.',
      'We photograph weddings, portraits, and everything in between with a calm approach, honest color, and attention to the people who make the moment matter.'
    ],
    linkLabel: 'See the Work →'
  },
  music: {
    eyebrow: 'Favorite songs',
    title: 'A soundtrack for the scroll.',
    description: 'Choose a song, press play, and let it accompany you through the rest of the story.',
    songs: [
      { title: 'I Want It That Way', artist: 'Backstreet Boys', youtubeId: '4fndeDfaWCg' },
      { title: 'Wonderful Tonight', artist: 'Eric Clapton', youtubeId: 'fxAiUq8yn34' },
      { title: 'Wake Me Up Before You Go-Go', artist: 'Wham!', youtubeId: 'pIgZ7gMze7A' },
      { title: '214', artist: 'Rivermaya', youtubeId: 'd59MC-PEJK0' },
      { title: 'Every Breath You Take', artist: 'The Police', youtubeId: 'OMOGaugKpzs' },
      { title: 'Kahit Maputi Na Ang Buhok Ko', artist: 'Rey Valera', youtubeId: 'EuuWgPrhvWQ' },
      { title: 'Truly Madly Deeply', artist: 'Savage Garden', youtubeId: 'WQnAxOQxQIU' },
      { title: 'With a Smile', artist: 'Eraserheads', youtubeId: 'TtqAUOxwh-k' },
      { title: 'Tuwing Umuulan at Kapiling Ka', artist: 'Eraserheads', youtubeId: 'vDxPghU4UBU' },
      { title: 'How Deep Is Your Love', artist: 'Bee Gees', youtubeId: 'XpqqjU7u5Yc' }
    ]
  },
  about: {
    whoLabel: 'who I am',
    whoParagraphs: [
      'I am Jonathan Agbisit, a passionate multimedia enthusiast dedicated to capturing the moments that make life worth remembering. Through photography and videography, I transform meaningful moments into timeless stories that you can look back on for years to come.',
      'Whether it is a celebration, milestone, special occasion, or a simple moment worth cherishing, I offer professional photo and video coverage tailored to bring a vision to life. My goal is not just to capture images, but to preserve the emotions, memories, and stories behind every moment—one moment at a time.'
    ],
    skillsLabel: 'what I do',
    skills: ['Photography', 'Videography', 'Editing', 'Layout Design'],
    locationLabel: 'based in Sison',
    locationText: 'I currently reside in Brgy. Tara-tara, Sison, Pangasinan, where I have dedicated over a decade to photography and multimedia. With years of experience capturing life’s most meaningful moments, I strive to turn every occasion into lasting memories through creative, timeless photographs and videos.',
    linkLabel: 'Explore the stories I have captured →'
  },
  selectedWork: { eyebrow: 'Selected Work', title: 'Selected work', description: 'A few moments from recent celebrations, portraits, and events.', linkLabel: 'View All →', categorySlugs: [] },
  servicesHome: { eyebrow: 'What we offer', title: 'Simple coverage, thoughtfully made.', linkLabel: 'See All Services →' },
  estimatorCta: { eyebrow: 'Build your package', title: 'Get a clear starting price\nbefore the conversation.', buttonLabel: 'Estimate & request a session' },
  servicesPage: {
    eyebrow: 'Services / 02', title: 'Coverage made for real life.', intro: 'From full-day weddings to portraits and event details. Start with a service, then shape it around the day you are planning.', note: 'Photo + video', buttonLabel: 'Estimate & Request a Session',
    categories: [{ key: 'photography', label: 'Photography' }, { key: 'additional', label: 'Additional Services' }]
  },
  portfolioPage: {
    kicker: 'Selected work', title: 'A bit of my photography', intro: 'Portraits, celebrations, stories, and everything in between.',
    indexEyebrow: 'Explore by collection', indexTitle: 'Choose a story.', indexText: 'Browse the work by the kind of moment you want to remember.',
    videoEyebrow: 'Motion stories', videoTitle: 'See the moments in motion.', videoIntro: 'A selection of films from celebrations and sessions.', videos: []
  },
  bookingPage: {
    eyebrow: 'Estimate + Booking / 04', estimateTitle: 'Build your package, then request a date.', requestTitle: 'Tell us what you are planning.', estimateIntro: 'Choose your service, coverage, and extras. Continue only if you want to request a session—the estimate remains yours with no obligation to book.', requestIntro: 'Your estimate is ready. Add your contact and event details so the studio can review the complete request.', workflowEyebrow: 'Before you begin', workflowTitle: 'From estimate to a confirmed session.', workflowIntro: 'This page helps you plan a package and send the studio the information needed to discuss your event. It does not instantly reserve a date or create a final agreement.',
    steps: [
      { title: 'Build an estimate', text: 'Choose an occasion, coverage time, and optional add-ons. The amount shown is a planning estimate—not a guaranteed final price.' },
      { title: 'Send a request', text: 'Add your preferred date and contact details, then submit. This sends a booking request for review; it is not yet a confirmed booking.' },
      { title: 'Discuss the details', text: 'The studio may contact you using the details provided, or you can reach the studio through any option on the contact page.' },
      { title: 'Confirm together', text: 'The final scope, schedule, price, availability, and payment arrangements are confirmed directly after both sides agree.' }
    ],
    notice: 'An estimate is approximate, and submitting this form is only a booking request. Please wait for direct confirmation from Jonathan Photography before treating your date as reserved.'
  },
  contactPage: { eyebrow: 'Contact / 05', title: 'Let’s start a conversation.', intro: 'Tell us what is happening, where it is, and when. Choose the channel that is easiest for you—we check them all.', note: 'Usually replies within 1–2 days' },
  faq: {
    eyebrow: 'FAQs', title: 'Frequently Asked Questions',
    items: [
      { question: 'Is the amount from the estimator the final price?', answer: 'No. It is a planning estimate based on the occasion, coverage time, and add-ons you select. The final quotation may change after the studio confirms the exact schedule, location, travel requirements, deliverables, special requests, and availability with you.' },
      { question: 'Does submitting the form reserve my date?', answer: 'No. Submitting the form creates a booking request for the studio to review; it is not an automatic confirmation or final contract. Your session is confirmed only after Jonathan Photography contacts you and both sides agree on the details.' },
      { question: 'What happens after I send a booking request?', answer: 'The website gives you a request reference and the studio receives the information you submitted. The administrator can contact you through your provided email or phone number, or you may follow up through any channel on the Contact page.' },
      { question: 'Can the coverage hours or package be customized?', answer: 'Yes. Select the closest available options to create a useful starting estimate, then explain your preferred timeline or special requirements in the request.' },
      { question: 'Why is a date unavailable, and can I change my request?', answer: 'The calendar blocks dates that already have a pending request, a confirmed session, or another studio commitment. Contact the studio with your reference number to request a change.' },
      { question: 'What information is collected and how is it used?', answer: 'The form collects the contact and event details needed to review availability, prepare an estimate, and communicate about your request. Read and accept the data privacy notice before submitting.' }
    ]
  },
  footer: { ctaTitle: 'Have a date in mind?', ctaText: 'Tell us what you are planning and we will help shape the coverage around it.', ctaButton: 'Start a booking', exploreTitle: 'Explore', connectTitle: 'Connect', studioTitle: 'Studio', copyright: 'Jonathan Photography. All rights reserved.', location: 'Pangasinan, Philippines' }
}

export function mergeSiteContent(value = {}) {
  const merge = (base, incoming) => {
    if (Array.isArray(base)) return Array.isArray(incoming) ? incoming : base
    if (!base || typeof base !== 'object') return incoming ?? base
    return Object.fromEntries(Object.entries(base).map(([key, item]) => [key, merge(item, incoming?.[key])]))
  }
  return merge(DEFAULT_SITE_CONTENT, value)
}
