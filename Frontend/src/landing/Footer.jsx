export default function Footer() {
  return (
    <>
      {/* Final CTA */}
      <section className="bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-white/5 py-24 transition-colors">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight transition-colors">
            Ready to stop fighting your storage limits?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg transition-colors">
            Get started in seconds — no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Start for free
            </a>
            <a
              href="/app"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 px-7 py-3 rounded-xl transition-all duration-150 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              Open app
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-white/5 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
              Stor<span className="text-blue-600 dark:text-blue-400">ra</span>
            </span>

            <nav aria-label="Footer navigation">
              <ul className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                {[
                  { label: "Docs", href: "#" },
                  { label: "GitHub", href: "#" },
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <p className="mt-6 text-center text-xs text-gray-600">
            Built with Node.js, React, AWS S3, and Razorpay.
          </p>
        </div>
      </footer>
    </>
  );
}
