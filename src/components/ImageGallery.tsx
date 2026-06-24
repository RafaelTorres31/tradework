import { useState } from 'react';

interface Props {
  images: string[];
  columns?: number;
}

export default function ImageGallery({ images, columns = 3 }: Props) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  const gridClass = columns === 4
    ? 'grid-cols-2 sm:grid-cols-4'
    : columns === 2
    ? 'grid-cols-2'
    : 'grid-cols-2 sm:grid-cols-3';

  return (
    <>
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 font-medium mb-2 uppercase tracking-wider flex items-center gap-1">
          Screenshots <span className="bg-gray-600/50 px-1.5 py-0.5 rounded-full">{images.length}</span>
        </p>
        <div className={`grid ${gridClass} gap-2`}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group aspect-video rounded-lg overflow-hidden border border-gray-600/30 cursor-pointer bg-gray-800/50"
              onClick={() => setLightboxImage(img)}
            >
              <img
                src={img}
                alt={`Screenshot ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-gray-300 font-medium">
                {idx + 1}/{images.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIdx = images.indexOf(lightboxImage);
                  const prevIdx = (currentIdx - 1 + images.length) % images.length;
                  setLightboxImage(images[prevIdx]);
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-16 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIdx = images.indexOf(lightboxImage);
                  const nextIdx = (currentIdx + 1) % images.length;
                  setLightboxImage(images[nextIdx]);
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <img
            src={lightboxImage}
            alt="Trade screenshot ampliado"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-sm text-white font-medium">
            {images.indexOf(lightboxImage) + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
