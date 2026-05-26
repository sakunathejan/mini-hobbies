import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import CtaBanner from "../components/home/CtaBanner.jsx";
import CategorySection from "../components/home/CategorySection.jsx";
import Hero from "../components/home/Hero.jsx";
import ProductGrid from "../components/products/ProductGrid.jsx";
import useFetch from "../hooks/useFetch.js";
import { getFeaturedProducts, getNewArrivals } from "../services/productService.js";

const SECTION_LIMIT = 4;

const HomePage = () => {
  const featured = useFetch(getFeaturedProducts, []);
  const arrivals = useFetch(getNewArrivals, []);
  const hasFeatured = featured.data?.length > 0;

  return (
    <>
      <Seo
        title="Die Cast Cars, Hot Wheels Sri Lanka & Collectible Toys"
        description="Shop Mini Hobbies for die cast cars, Hot Wheels Sri Lanka collectibles, scale models, anime figures, RC toys, and premium hobby store finds."
      />
      <Hero />
      <CategorySection />

      {hasFeatured && (
        <section className="container-page py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-ember">Featured</p>
              <h2 className="section-title mt-2">Collector picks</h2>
            </div>
            {featured.data.length > SECTION_LIMIT && (
              <Link to="/products?featured=true" className="group hidden items-center gap-1 text-sm font-bold text-ember sm:flex">
                Shop all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
          <ProductGrid products={featured.data} loading={featured.loading} compact max={SECTION_LIMIT} />
          {featured.data.length > SECTION_LIMIT && (
            <div className="mt-5 text-center sm:hidden">
              <Link to="/products?featured=true" className="btn-secondary text-sm">
                Shop all featured <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      )}

      <section className="container-page py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-ember">Fresh stock</p>
            <h2 className="section-title mt-2">New arrivals</h2>
          </div>
          {arrivals.data?.length > SECTION_LIMIT && (
            <Link to="/products?sort=-createdAt" className="group hidden items-center gap-1 text-sm font-bold text-ember sm:flex">
              Shop all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
        <ProductGrid products={arrivals.data} loading={arrivals.loading} compact max={SECTION_LIMIT} />
        {arrivals.data?.length > SECTION_LIMIT && (
          <div className="mt-5 text-center sm:hidden">
            <Link to="/products?sort=-createdAt" className="btn-secondary text-sm">
              Shop all new arrivals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <CtaBanner />
    </>
  );
};

export default HomePage;
