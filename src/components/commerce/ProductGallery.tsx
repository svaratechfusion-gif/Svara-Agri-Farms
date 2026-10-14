"use client";

import Image from "next/image";
import { useState } from "react";

import { TiltStage } from "@/components/botanical/TiltStage";
import { photos, type PhotoKey } from "@/content/photos";

interface ProductGalleryProps {
  gallery: readonly PhotoKey[];
  productName: string;
  preloadFirst?: boolean;
}

export function ProductGallery({
  gallery,
  productName,
  preloadFirst = false,
}: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const current = photos[gallery[selected]];

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse md:gap-5">
      <TiltStage maxTilt={3} className="w-full md:flex-1">
        <div className="media-frame aspect-[4/5] w-full leaf-plate">
          {gallery.map((key, index) => {
            const photo = photos[key];
            const isSelected = index === selected;
            return (
              <Image
                key={key}
                src={photo.src}
                alt={isSelected ? photo.alt : ""}
                aria-hidden={!isSelected}
                fill
                placeholder="blur"
                preload={preloadFirst && index === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={`object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-organic)] ${
                  isSelected ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
                }`}
              />
            );
          })}
        </div>
      </TiltStage>

      <div
        role="group"
        aria-label={`${productName} images`}
        className="flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible"
      >
        {gallery.map((key, index) => {
          const photo = photos[key];
          const isSelected = index === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={isSelected}
              aria-label={`Show image ${index + 1} of ${gallery.length}`}
              className={`media-frame aspect-[4/5] w-16 shrink-0 leaf-plate-sm transition-opacity duration-500 md:w-full ${
                isSelected
                  ? "opacity-100 ring-1 ring-forest ring-offset-2 ring-offset-ivory"
                  : "opacity-55 hover:opacity-90"
              }`}
            >
              <Image src={photo.src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing: {current.alt}
      </p>
    </div>
  );
}
