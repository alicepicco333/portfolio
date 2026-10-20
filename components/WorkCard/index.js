import React from "react";

const WorkCard = ({ img, name, description, tags, category, cardNumber, surfaceColor, accentColor }) => {
  const hasImage = Boolean(img);

  return (
    <article
      className="relative w-full min-h-[76vh] overflow-hidden rounded-[2rem] border border-[#2B2118] transition-transform duration-300 hover:-translate-y-1 lg:min-h-[82vh]"
      style={{
        backgroundColor: surfaceColor,
        boxShadow: "0 24px 80px rgba(43, 33, 24, 0.14)",
      }}
    >
      <div className="grid min-h-[76vh] grid-cols-1 lg:min-h-[82vh] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[22rem] overflow-hidden border-b border-[#2B2118] lg:min-h-full lg:border-b-0 lg:border-r">
          {hasImage ? (
            <img
              src={img}
              alt={name}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              className="flex h-full w-full items-end p-8"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${surfaceColor} 100%)`,
              }}
            >
              <p className="text-left text-3xl font-bold text-[#2B2118] lg:text-5xl">{name}</p>
            </div>
          )}
          <div className="absolute left-5 top-5 rounded-full border border-[#2B2118] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#2B2118]"
            style={{ backgroundColor: accentColor }}
          >
            {category}
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 text-[#2B2118] sm:p-8 lg:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] opacity-70">Project {cardNumber}</p>
            <h3 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{name}</h3>
            <p className="mt-6 max-w-xl text-base leading-relaxed opacity-85 sm:text-lg">{description}</p>
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full border border-[#2B2118] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]"
                  style={{ backgroundColor: accentColor }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#2B2118] pt-5">
              <span className="text-sm uppercase tracking-[0.22em] opacity-70">Scroll to stack the next project</span>
              <span className="rounded-full border border-[#2B2118] px-4 py-2 text-sm font-bold uppercase tracking-[0.16em]"
                style={{ backgroundColor: accentColor }}
              >
                Open project
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${surfaceColor} 100%)`,
        }}
      />
    </article>
  );
};

export default WorkCard;
