import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4 py-16 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">404</p>
        <h1 className="mt-3 text-4xl font-black text-white">Page not found</h1>
        <p className="mt-3 text-white/64">
          The page you are looking for is not available.
        </p>
        <Link
          href="/anime"
          className="button-primary mt-6"
        >
          Explore anime
        </Link>
      </div>
    </div>
  );
}
