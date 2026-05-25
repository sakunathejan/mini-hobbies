import { Helmet } from "react-helmet-async";

const Seo = ({ title, description, canonical = "/" }) => {
  const fullTitle = title ? `${title} | Mini Hobbies` : "Mini Hobbies";
  const url = `${import.meta.env.VITE_STORE_URL || "http://localhost:5173"}${canonical}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
};

export default Seo;
