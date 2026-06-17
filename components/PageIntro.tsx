interface PageIntroProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 text-4xl font-black tracking-normal text-white sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-white/68 sm:text-lg">{description}</p>
    </div>
  );
}
