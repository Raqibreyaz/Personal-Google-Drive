import { useState } from "react";

const faqs = [
  {
    q: "What happens if my payment fails?",
    a: "Razorpay retries the charge automatically. Storra gives you a grace period (a few days) during which you retain full access. If the charge still fails after the grace period, your account is moved to a restricted state and uploads are paused until billing is resolved.",
  },
  {
    q: "Can I downgrade if I'm over the new plan's limit?",
    a: "Yes, but you won't be able to upload new files until your stored data is within the new plan's quota. Existing files are never deleted automatically — you stay in control of what to remove.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The free plan gives you 100 MB of storage with no credit card required. You can upgrade to a paid plan at any time directly from your dashboard.",
  },
  {
    q: "Do you proxy file data through your servers?",
    a: "No. Storra uses presigned S3 URLs, so your files travel directly from your browser to AWS S3. Our servers only sign the upload URL and record metadata — they never see or store the file bytes themselves.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="bg-white dark:bg-gray-950 py-20 border-t border-gray-200 dark:border-white/5 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-12 transition-colors">
          Frequently asked questions
        </h2>

        <div className="flex flex-col gap-3">
          {faqs.map((item, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden transition-colors"
            >
              <button
                id={`faq-btn-${i}`}
                aria-expanded={open === i}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <span>{item.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open === i && (
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                  className="px-5 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-200 dark:border-white/5 pt-3 transition-colors"
                >
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
