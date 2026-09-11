const FAQS = [
  {
    question: 'Is the amount from the estimator the final price?',
    answer: 'No. It is a planning estimate based on the occasion, coverage time, and add-ons you select. The final quotation may change after the studio confirms the exact schedule, location, travel requirements, deliverables, special requests, and availability with you. You may use the estimator without continuing to a booking request.',
  },
  {
    question: 'Does submitting the form reserve my date?',
    answer: 'No. Submitting the form creates a booking request for the studio to review; it is not an automatic confirmation or final contract. Your session is confirmed only after Jonathan Photography contacts you, verifies availability, and both sides agree on the package, price, schedule, and any required payment arrangements.',
  },
  {
    question: 'What happens after I send a booking request?',
    answer: 'The website gives you a request reference, while the studio receives the event information, preferred date, selected estimate, and contact details you submitted. The administrator can contact you through your provided email or phone number. You may also follow up through any channel listed on the Contact page and include your reference number so the request is easier to locate.',
  },
  {
    question: 'Can the coverage hours or package be customized?',
    answer: 'Yes. Select the closest available options to create a useful starting estimate, then explain your preferred timeline or special requirements in the request. Split schedules, additional locations, specific deliverables, and other details can be discussed directly before the studio provides the final quotation.',
  },
  {
    question: 'Why is a date unavailable, and can I change my request?',
    answer: 'The calendar blocks dates that already have a pending request, a confirmed session, or another studio commitment. To request a different date, correct information, or cancel, contact the studio and provide your request reference. Availability can change, so an open date on the calendar still requires direct confirmation.',
  },
  {
    question: 'What information is collected and how is it used?',
    answer: 'The form collects the contact and event details needed to identify you, review availability, prepare an estimate, and communicate about your request. It is not used to capture payment on the website. Read and accept the data privacy notice beside the form before submitting, and avoid placing unnecessary sensitive information in the event notes.',
  },
]

export default function Faq() {
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="faq__inner">
        <span className="faq__eyebrow">FAQs</span>
        <h2 className="faq__title" id="faq-title">Frequently Asked Questions</h2>

        <div className="faq__list">
          {FAQS.map(({ question, answer }) => (
            <details className="faq__item" key={question}>
              <summary className="faq__question">
                <span>{question}</span>
                <span className="faq__toggle" aria-hidden="true">+</span>
              </summary>
              <p className="faq__answer">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
