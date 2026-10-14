function FormatList({ formats }) {
  if (!formats || formats.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wide">
        Available Formats
      </h3>

      {formats.map((f, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 hover:border-amber-400/50 transition"
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${
                f.type === "audio"
                  ? "bg-purple-500/20 text-purple-300"
                  : f.type === "video"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-slate-600/30 text-slate-300"
              }`}
            >
              {f.type}
            </span>
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">
                {f.resolution}
              </span>
              <span className="text-slate-500 text-xs">{f.video_size}</span>
            </div>
          </div>

          <a href={f.url} target="_blank" rel="noopener noreferrer">
            <button className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 text-sm font-semibold transition">
              Download
            </button>
          </a>
        </div>
      ))}
    </div>
  );
}

export default FormatList;