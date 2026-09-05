const FAQS = [
  {
    question: 'How do the estimate and booking request work?',
    answer: 'Start by choosing a photography service, coverage, and any add-ons in the estimator. You will see an estimated total before you continue to the booking form. Your selected estimate is included with the request so the studio knows what you are looking for.',
  },
  {
    question: 'Can I use the estimator without booking?',
    answer: 'Yes. You can calculate an estimate for planning purposes without submitting a booking request. Booking is only required when you decide to continue and ask the studio about a date.',
  },
  {
    question: 'Is the estimated price the final price?',
    answer: 'No. The website provides a preliminary estimate based on your selections. The studio will confirm the final package, price, schedule, location, and any special requirements with you directly.',
  },
  {
    question: 'Does submitting a request confirm my booking?',
    answer: 'Not yet. A submitted form is a booking request, not a final reservation. The requested date is temporarily marked unavailable while the studio reviews it, and the booking becomes confirmed only after the studio contacts you and both sides agree on the details.',
  },
  {
    question: 'How does the availability calendar work?',
    answer: 'Choose an available date when completing your request. Dates with pending requests or confirmed sessions cannot be selected. If a request is cancelled, that date becomes available again unless another studio booking is already scheduled.',
  },
  {
    question: 'What happens after I submit a booking request?',
    answer: 'You will receive a request reference, and the studio will receive your contact details, preferred date, event information, and estimate. The studio can then contact you outside the website to discuss and finalize the session.',
  },
  {
    question: 'Can I change or cancel my request?',
    answer: 'Yes. Contact the studio and provide your request reference so the details can be reviewed or the request can be cancelled. Once it is cancelled in the system, the calendar is updated automatically.',
  },
  {
    question: 'How is my personal information used?',
    answer: 'Your information is used to review your request, prepare for your session, and communicate with you about the booking. Please review the privacy notice on the booking form before submitting your details.',
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
