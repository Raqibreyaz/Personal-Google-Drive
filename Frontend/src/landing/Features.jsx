const benefits = [
  {
    emoji: "🚫",
    title: "No surprise overages",
    body: "Storage limits are enforced server-side via Razorpay webhooks — your quota never drifts out of sync with your plan.",
  },
  {
    emoji: "⚡",
    title: "Direct, efficient uploads",
    body: "Files go straight to S3 via presigned URLs, with backend-enforced content-type and size checks before signing.",
  },
  {
    emoji: "🔄",
    title: "Clean subscription lifecycle",
    body: "Grace periods, past-due states, and downgrades are handled automatically so billing always reflects reality.",
  },
];

const featureRows = [
  {
    title: "Path-aware directory details",
    text: "Storra tracks every folder's full path from root and computes recursive counts of child files and folders, so you always know exactly where you are in your drive.",
    visual: (
      <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-3 transition-colors">
        <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
          {["My Drive", "Projects", "2025", "Q2"].map((crumb, i, arr) => (
            <span key={crumb} className="flex items-center gap-1">
              <span className={i === arr.length - 1 ? "text-white font-medium" : "hover:text-gray-200 cursor-pointer"}>{crumb}</span>
              {i < arr.length - 1 && <span className="text-gray-600">/</span>}
            </span>
          ))}
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-blue-400 text-lg">📁</span>
            <span><strong className="text-white">12</strong> folders</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-purple-400 text-lg">📄</span>
            <span><strong className="text-white">87</strong> files</span>
          </div>
        </div>
      </div>
    ),
    flip: false,
  },
  {
    title: "Direct S3 uploads with guardrails",
    text: "Your browser talks directly to S3 using a presigned URL signed by the Storra backend. The backend validates content-type and file size before signing, so bad actors can't sneak in oversized or mistyped files.",
    visual: (
      <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-3 font-mono text-xs transition-colors">
        <div className="flex items-center gap-3">
          <span className="bg-blue-500/10 text-blue-400 border border-blue-400/20 px-3 py-1.5 rounded-lg">Browser</span>
          <span className="text-gray-600">──────▶</span>
          <span className="bg-orange-500/10 text-orange-400 border border-orange-400/20 px-3 py-1.5 rounded-lg">S3</span>
        </div>
        <div className="text-[10px] text-gray-500 pl-1">via presigned URL (PUT, size+type checked)</div>
        <div className="h-px bg-white/5" />
        <div className="flex items-center gap-3">
          <span className="bg-purple-500/10 text-purple-400 border border-purple-400/20 px-3 py-1.5 rounded-lg">Backend</span>
          <span className="text-gray-600">──signs──▶</span>
          <span className="text-gray-400">URL</span>
        </div>
      </div>
    ),
    flip: true,
  },
  {
    title: "Webhook-powered subscriptions",
    text: "Razorpay fires webhooks on every subscription event. Storra listens, updates the user's plan in the database, and immediately adjusts the enforced storage quota — no manual intervention needed.",
    visual: (
      <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-2 font-mono text-xs transition-colors">
        {[
          { from: "Razorpay", arrow: "→ Webhook →", to: "Storra API" },
          { from: "Storra API", arrow: "→ writes →", to: "Database" },
          { from: "Database", arrow: "→ updates →", to: "Storage limit" },
        ].map((row) => (
          <div key={row.from} className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-500/10 text-blue-300 border border-blue-400/10 px-2 py-1 rounded">{row.from}</span>
            <span className="text-gray-600">{row.arrow}</span>
            <span className="bg-purple-500/10 text-purple-300 border border-purple-400/10 px-2 py-1 rounded">{row.to}</span>
          </div>
        ))}
        <div className="mt-2 text-[10px] text-green-400">✓ Quota always matches billing</div>
      </div>
    ),
    flip: false,
  },
];

export default function Features() {
  return (
    <>
      {/* Benefits strip */}
      <section id="features" className="bg-white dark:bg-gray-950 py-20 border-t border-gray-200 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 text-lg leading-relaxed transition-colors">
            Storra is a cloud drive built to{" "}
            <span className="text-gray-900 dark:text-white font-medium">never desync</span> your
            storage, billing, and subscription state.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-blue-500/30 transition-colors duration-200"
              >
                <span className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center text-xl">
                  {b.emoji}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg transition-colors">{b.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed transition-colors">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature detail rows */}
      <section id="feature-details" className="bg-gray-50 dark:bg-gray-900/50 py-20 border-t border-gray-200 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-24">
          {featureRows.map((row) => (
            <div
              key={row.title}
              className={`grid lg:grid-cols-2 gap-10 items-center ${row.flip ? "lg:[direction:rtl]" : ""}`}
            >
              <div className={`flex flex-col gap-4 ${row.flip ? "lg:[direction:ltr]" : ""}`}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{row.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">{row.text}</p>
              </div>
              <div className={row.flip ? "lg:[direction:ltr]" : ""}>{row.visual}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
