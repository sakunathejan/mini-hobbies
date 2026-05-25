import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CtaBanner = () => (
  <section className="container-page pb-14">
    <div className="grid gap-6 rounded-lg bg-gray-950 p-8 text-white md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h2 className="text-2xl font-black">Looking for a specific model?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
          Use the checkout notes or contact links to request special diecast collectibles, rare Hot Wheels,
          scale models, or figures.
        </p>
      </div>
      <Link to="/products" className="btn-primary">
        Browse catalog <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
);

export default CtaBanner;
