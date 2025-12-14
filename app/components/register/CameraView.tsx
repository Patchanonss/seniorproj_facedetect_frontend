interface CameraViewProps {
  capturedImage: string | null;
  validationWarning: string | null;
  loading: boolean;
  validatePhoto: () => void;
  retake: () => void;
  apiUrl: string;
}

export default function CameraView({
  capturedImage,
  validationWarning,
  loading,
  validatePhoto,
  retake,
  apiUrl,
}: CameraViewProps) {
  return (
    <div className="flex-[3] flex flex-col items-center justify-center p-4 bg-black/5 rounded-2xl border border-dashed border-slate-300">
      <div className="w-full h-full relative flex items-center justify-center overflow-hidden rounded-lg shadow-inner bg-black">
        {!capturedImage ? (
          /* Use Backend CLEAN Feed */
          <img
            src={`${apiUrl}/video_feed/clean`}
            crossOrigin="anonymous"
            className="w-full h-full object-contain bg-black"
            alt="Live Camera Feed"
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Preview"
              className="w-full h-full object-contain bg-black"
            />
            {/* Overlay for Validation Success */}
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10">
              ✓ QUALITY OK
            </div>
          </div>
        )}
        
        {/* Face Guide Overlay (Only show when live feed is active) */}
        {!capturedImage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-dashed border-white/40 rounded-[3rem] z-10 pointer-events-none flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
                <span className="text-white/60 text-sm font-bold tracking-widest uppercase bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Place Face Here
                </span>
            </div>
        )}
      </div>

      {/* Validation Warning */}
      {validationWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4 text-base w-full rounded shadow-sm">
          <p className="font-bold">⚠️ Warning</p>
          <p>{validationWarning}</p>
        </div>
      )}

      <div className="flex gap-4 mt-6 w-full max-w-md">
        {!capturedImage ? (
          <button
            onClick={validatePhoto}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50 w-full"
          >
            {loading ? "Analyzing..." : "📸 Validate Face"}
          </button>
        ) : (
          <button
            onClick={retake}
            className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-orange-600 transition shadow-lg w-full"
          >
            🔄 Retake
          </button>
        )}
      </div>
    </div>
  );
}
