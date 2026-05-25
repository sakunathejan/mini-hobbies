import { Car, Gamepad2, Gift, Joystick, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch.js";
import { getCategories } from "../../services/categoryService.js";

const icons = [Car, Star, Shield, Gift, Joystick, Gamepad2];

const CategorySection = () => {
  const { data: categories, loading } = useFetch(getCategories, []);

  if (loading) {
    return (
      <section className="container-page py-14">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </section>
    );
  }

  if (!categories?.length) {
    return null;
  }

  return (
    <section className="container-page py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-ember">Categories</p>
          <h2 className="section-title mt-2">Shop by collector lane</h2>
        </div>
        <Link to="/products" className="hidden text-sm font-bold text-ember sm:block">
          View all
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = icons[index % icons.length];
          return (
            <Link
              key={category._id}
              to={`/products?category=${category._id}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-soft"
            >
              <Icon className="h-8 w-8 text-ember" />
              <h3 className="mt-4 text-lg font-black text-gray-950">{category.name}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {category.description || "Curated picks for display shelves, dioramas, gifts, and serious collections."}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySection;
