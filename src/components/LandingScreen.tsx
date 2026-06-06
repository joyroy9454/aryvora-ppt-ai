"use client";

interface LandingScreenProps {
  topic: string;
  slideCount: number;
  loading: boolean;
  onTopicChange: (v: string) => void;
  onSlideCountChange: (v: number) => void;
  onGenerate: (topic: string, count: number) => void;
}

export default function LandingScreen({
  topic,
  slideCount,
  loading,
  onTopicChange,
  onSlideCountChange,
  onGenerate,
}: LandingScreenProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length >= 2) {
      onGenerate(topic.trim(), slideCount);
    }
  };

  const suggestions = [
    "The Future of Artificial Intelligence",
    "Climate Change Solutions",
    "Startup Pitch Deck",
    "Digital Marketing Strategy",
    "Remote Work Best Practices",
    "Blockchain Explained",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-xl text-slate-900">Aryvora</span>
          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">PPT AI</span>
        </div>
        <div className="text-xs text-slate-400">No sign-up required</div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            Powered by OpenRouter
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
            Stunning presentations
            <br />
            <span className="text-brand-600">in seconds</span>
          </h1>

          <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto">
            Enter a topic, pick a theme, and let AI generate a complete presentation.
            Edit, customize, and export to PPTX or PDF.
          </p>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-2">
              <div className="flex items-center gap-2 px-4 py-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => onTopicChange(e.target.value)}
                  placeholder="Enter your presentation topic..."
                  className="flex-1 text-lg bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || topic.trim().length < 2}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                      Working...
                    </>
                  ) : (
                    "Generate \u2192"
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100">
                <label className="text-xs text-slate-500 whitespace-nowrap">Slides:</label>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={slideCount}
                  onChange={(e) => onSlideCountChange(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                  disabled={loading}
                />
                <span className="text-sm font-semibold text-slate-700 w-6 text-right">{slideCount}</span>
              </div>
            </div>
          </form>

          {/* Suggestions */}
          <div className="mt-8">
            <div className="text-xs text-slate-400 mb-3">Try a topic:</div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onTopicChange(s)}
                  className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-full text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-400">
        Aryvora PPT AI &mdash; No accounts, no payments, no hassle.
      </footer>
    </div>
  );
}
