import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="bg-graphite text-white">
    <div className="container-page grid min-h-[560px] items-center gap-10 py-14 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-200">
          <Sparkles className="h-4 w-4 text-mint" /> Collector focused. Sri Lanka ready.
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-normal sm:text-6xl">
          Mini Hobbies
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
          Browse die cast cars, Hot Wheels Sri Lanka finds, scale models, anime figures,
          RC toys, and collectible toys in a clean catalog built for hobby collectors.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/products" className="btn-primary">
            Shop collectibles <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/products?featured=true" className="btn-secondary border-white/20 bg-white/10 text-white hover:border-white">
            View featured
          </Link>
        </div>
      </div>
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=1200&q=85"
          alt="Die cast model car collection"
          className="aspect-[4/3] w-full rounded-lg object-cover shadow-soft"
        />
        <div className="absolute bottom-4 left-4 rounded-lg bg-white/95 p-4 text-gray-950 shadow-soft">
          <p className="text-sm font-semibold">New arrivals weekly</p>
          <p className="text-xs text-gray-600">Hot Wheels, JDM, classics, figures</p>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
