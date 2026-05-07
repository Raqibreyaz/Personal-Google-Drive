export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white dark:bg-gray-950 transition-colors">
      {/* Gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left */}
        <div className="flex flex-col gap-6">
          <span className="inline-block w-fit text-xs font-semibold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
            Cloud storage for humans
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight transition-colors">
            Fast, predictable cloud storage that just works.
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl transition-colors">
            Upload directly to S3, keep billing in sync with usage, and stop
            worrying about quota edge cases.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-950"
            >
              Start for free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/app"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 px-6 py-3 rounded-xl transition-all duration-150 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              Open app
            </a>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-500 transition-colors">
            Free 100 MB plan. Upgrade to 2 TB, 5 TB, or 10 TB anytime.
          </p>
        </div>

        {/* Right – fake app screenshot card */}
        <div className="relative">
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/60 bg-white dark:bg-gray-900 transition-colors">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-white/5 transition-colors">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-400/80" />
              <span className="ml-3 text-xs text-gray-500">storra.app</span>
            </div>

            <div className="flex h-72">
              {/* Sidebar */}
              <aside className="w-44 bg-gray-50 dark:bg-gray-800/60 border-r border-gray-200 dark:border-white/5 p-3 flex flex-col gap-1 transition-colors">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">My Drive</p>
                {["📁 Projects", "📁 Photos", "📁 Backups", "📁 Shared", "📄 Resume.pdf"].map((item) => (
                  <div
                    key={item}
                    className={`text-xs px-2 py-1.5 rounded-md cursor-default ${
                      item.includes("Projects")
                        ? "bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </aside>

              {/* Main panel */}
              <main className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                {/* Usage bar */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-white/5 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Plan usage</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">18.3 GB of 2 TB</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-[0.9%] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
                  </div>
                </div>

                {/* File rows */}
                {[
                  { name: "design-system.fig", size: "14.2 MB", icon: "🎨" },
                  { name: "api-docs-v3.pdf", size: "2.8 MB", icon: "📄" },
                  { name: "backup-2025-04.zip", size: "1.3 GB", icon: "🗜️" },
                ].map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/5 transition-colors"
                  >
                    <span className="text-base">{f.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 dark:text-white truncate">{f.name}</p>
                      <p className="text-[10px] text-gray-500">{f.size}</p>
                    </div>
                  </div>
                ))}

                {/* Tags */}
                <div className="flex gap-2 mt-auto flex-wrap">
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-400/20 px-2 py-0.5 rounded-full">
                    Direct S3 upload
                  </span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-400/20 px-2 py-0.5 rounded-full">
                    Subscription in sync
                  </span>
                </div>
              </main>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-xl shadow-gray-200/50 dark:shadow-black/60 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors">
            <span className="text-green-500 dark:text-green-400 text-base">✓</span> Quota enforced server-side
          </div>
        </div>
      </div>
    </section>
  );
}
