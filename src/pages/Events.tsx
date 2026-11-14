import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

interface EventPhoto {
  src: string;
  alt: string;
}

const photo = (id: number, alt: string): EventPhoto => ({
  src: `/events/event-${id}.webp`,
  alt,
});

const photos: EventPhoto[] = [
  photo(7310, "Community members seated together during the Moenviron session"),
  photo(7377, "A Moenviron team member in conversation with a participant"),
  photo(7299, "Participants listening during the community session"),
  photo(7357, "A Moenviron team member showing a garment to the room"),
  photo(7306, "A Moenviron team member registering participants"),
  photo(7317, "Participants gathered in the hall"),
  photo(7337, "A Moenviron team member addressing the group"),
  photo(7308, "A participant signing the attendance sheet"),
  photo(7363, "A Moenviron team member presenting to the audience"),
  photo(7315, "A participant signing in with help from the Moenviron team"),
  photo(7373, "Wide view of the hall during the session"),
  photo(7327, "A Moenviron team member taking notes with participants"),
  photo(7304, "View of the session through the hall partition"),
  photo(7298, "The hall set up and ready before participants arrive"),
];

const Events = () => {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (delta: number) =>
      setActive((current) =>
        current === null ? current : (current + delta + photos.length) % photos.length
      ),
    []
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, step]);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-forest/20">
      <SEO
        title="Events"
        description="Photos from Moenviron community events in Kenya: bringing people together around textile waste, circular fashion and sustainable livelihoods."
        image="https://moenviron.com/events/event-7310.webp"
        url="https://moenviron.com/events"
      />
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-black/5 pb-12 pt-20 md:pt-28">
          <div className="container">
            <div className="max-w-3xl">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-forest" />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Events / Community
                </p>
              </div>
              <h1 className="font-display text-5xl font-medium leading-[1.1] tracking-tight text-foreground md:text-7xl">
                In the community
              </h1>
              <p className="mt-8 max-w-xl text-xl leading-relaxed text-muted-foreground">
                Moments from our community engagement session in Kenya, where
                our team met local residents to talk about textile waste and
                what a circular future can look like.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((item, index) => (
                <li key={item.src} className={index === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`View photo: ${item.alt}`}
                    className="group block h-full w-full overflow-hidden rounded-lg bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      width={1600}
                      height={898}
                      loading={index < 3 ? "eager" : "lazy"}
                      decoding="async"
                      className="aspect-[16/9] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-black/5 py-16">
          <div className="container flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-medium tracking-tight">
                Want to take part in the next one?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Get in touch to host, partner on or join a Moenviron community event.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">
                Contact us <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Event photo viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close photo"
            autoFocus
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-6"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <img
            src={photos[active].src}
            alt={photos[active].alt}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-md object-contain"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="absolute right-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-6"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/70">
            {active + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default Events;
