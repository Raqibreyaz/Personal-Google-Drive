const steps = [
  {
    n: "01",
    title: "Pick a plan",
    body: "Start on the free 100 MB tier or choose a 2 TB, 5 TB, or 10 TB Razorpay subscription — no credit card needed for the free plan.",
  },
  {
    n: "02",
    title: "Upload directly to S3",
    body: "Drag and drop files into Storra. We sign a presigned URL on the backend and your browser uploads straight to S3 — fast and bandwidth-efficient.",
  },
  {
    n: "03",
    title: "Stay in control",
    body: "Monitor usage, see billing cycle dates, and upgrade or downgrade at any time. Quota updates the moment a Razorpay webhook lands.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 dark:bg-gray-950 py-20 border-t border-gray-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            How Storra works
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {steps.map((s) => (
            <div
              key={s.n}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden transition-colors"
            >
              <span className="text-6xl font-black text-gray-100 dark:text-white/5 absolute -top-2 -right-2 select-none leading-none transition-colors">
                {s.n}
              </span>
              <span className="w-9 h-9 bg-blue-600 text-white text-sm font-bold rounded-xl flex items-center justify-center relative z-10">
                {s.n}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white relative z-10 transition-colors">{s.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed relative z-10 transition-colors">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/plans"
            className="inline-flex items-center gap-2 border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 px-6 py-3 rounded-xl transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            See plans
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
