import Seo from "../components/Seo.jsx";
import ProductGrid from "../components/products/ProductGrid.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const WishlistPage = () => {
  const { items } = useWishlist();

  return (
    <>
      <Seo title="Wishlist" description="Your saved Mini Hobbies collectible toys and models." canonical="/wishlist" />
      <section className="container-page py-10">
        <h1 className="section-title mb-8">Wishlist</h1>
        <ProductGrid products={items} />
      </section>
    </>
  );
};

export default WishlistPage;
