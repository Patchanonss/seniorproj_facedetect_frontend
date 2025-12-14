interface LiveFeedProps {
  apiUrl: string;
}

export default function LiveFeed({ apiUrl }: LiveFeedProps) {
  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video relative group">
      {/* THE MAGICAL IMG TAG */}
      <img
        src={`${apiUrl}/video_feed`}
        alt="Live Feed"
        className="w-full h-full object-contain"
      />

      {/* Overlay */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono">
        ● REC
      </div>
    </div>
  );
}
