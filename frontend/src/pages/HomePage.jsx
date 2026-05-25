import Seo from "../components/Seo.jsx";
import CtaBanner from "../components/home/CtaBanner.jsx";
import CategorySection from "../components/home/CategorySection.jsx";
import Hero from "../components/home/Hero.jsx";
import ProductGrid from "../components/products/ProductGrid.jsx";
import useFetch from "../hooks/useFetch.js";
import { getFeaturedProducts, getNewArrivals } from "../services/productService.js";

const HomePage = () => {
  const featured = useFetch(getFeaturedProducts, []);
  const arrivals = useFetch(getNewArrivals, []);

  return (
    <>
      <Seo
        title="Die Cast Cars, Hot Wheels Sri Lanka & Collectible Toys"
        description="Shop Mini Hobbies for die cast cars, Hot Wheels Sri Lanka collectibles, scale models, anime figures, RC toys, and premium hobby store finds."
      />
      <Hero />
      <CategorySection />
      <section className="container-page py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-ember">Featured</p>
            <h2 className="section-title mt-2">Collector picks</h2>
          </div>
        </div>
        <ProductGrid products={featured.data || []} loading={featured.loading} />
      </section>
      <section className="container-page py-12">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-ember">Fresh stock</p>
          <h2 className="section-title mt-2">New arrivals</h2>
        </div>
        <ProductGrid products={arrivals.data || []} loading={arrivals.loading} />
      </section>
      <CtaBanner />
    </>
  );
};

export default HomePage;
