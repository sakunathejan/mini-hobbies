import { Facebook, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-gray-200 bg-graphite text-white">
    <div className="container-page grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <h2 className="text-xl font-black">Mini Hobbies</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-gray-300">
          A modern hobby store for die cast cars, Hot Wheels Sri Lanka, scale models, anime figures,
          RC toys, and collectible toys.
        </p>
      </div>
      <div>
        <h3 className="font-semibold">Shop</h3>
        <div className="mt-3 grid gap-2 text-sm text-gray-300">
          <Link to="/products">All products</Link>
          <Link to="/products?category=Hot%20Wheels">Hot Wheels</Link>
          <Link to="/products?category=Scale%20Models">Scale models</Link>
        </div>
      </div>
      <div>
        <h3 className="font-semibold">Social</h3>
        <div className="mt-3 flex gap-3">
          <a aria-label="Instagram" href="https://instagram.com" className="rounded-md bg-white/10 p-2"><Instagram className="h-5 w-5" /></a>
          <a aria-label="Facebook" href="https://facebook.com" className="rounded-md bg-white/10 p-2"><Facebook className="h-5 w-5" /></a>
          <a aria-label="Email" href="mailto:hello@minihobbies.lk" className="rounded-md bg-white/10 p-2"><Mail className="h-5 w-5" /></a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
