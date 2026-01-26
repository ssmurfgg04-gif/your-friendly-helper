import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  product?: {
    name: string;
    description: string;
    price: number;
    currency: string;
    image?: string;
    sku?: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
    brand?: string;
    category?: string;
  };
}

const defaultMeta = {
  title: "Moenviron Loop - Sustainable Fashion from Recycled Textiles",
  description: "Pioneering the circular economy through sustainable fashion. Ethical UK collection, advanced Kenya processing, and measurable global impact.",
  image: "https://wwtszgqxspdsarsvqqws.supabase.co/storage/v1/object/public/project-uploads/2274ce5a-a92d-4b73-b73e-99562f585de3/moenviron-logo-resized-1768037588209.webp",
  url: "https://moenviron.com",
};

export function SEO({ title, description, image, url, type = "website", product }: SEOProps) {
  const pageTitle = title ? `${title} | Moenviron Loop` : defaultMeta.title;
  const pageDescription = description || defaultMeta.description;
  const pageImage = image || defaultMeta.image;
  const pageUrl = url || defaultMeta.url;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Moenviron Loop",
    url: defaultMeta.url,
    logo: defaultMeta.image,
    description: defaultMeta.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+44 7394 382060",
      contactType: "customer service",
      email: "moses@moenviron.com",
      areaServed: ["GB", "KE"],
      availableLanguage: ["English"],
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: "Wiltshire",
      postalCode: "SP11 9GP",
      addressCountry: "GB",
    },
    sameAs: [
      "https://www.linkedin.com/in/moses-onyuro-98336837b/",
      "https://www.instagram.com/moenviron/",
      "https://www.tiktok.com/@moenviron",
    ],
  };

  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.image || pageImage,
        sku: product.sku || product.name.toLowerCase().replace(/\s+/g, "-"),
        brand: {
          "@type": "Brand",
          name: product.brand || "Moenviron Loop",
        },
        category: product.category,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: product.currency,
          availability: `https://schema.org/${product.availability || "InStock"}`,
          seller: {
            "@type": "Organization",
            name: "Moenviron Loop",
          },
        },
        manufacturer: {
          "@type": "Organization",
          name: "Moenviron Loop",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Nairobi",
            addressCountry: "KE",
          },
        },
        isRelatedTo: {
          "@type": "Thing",
          name: "Sustainable Fashion",
        },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Material",
            value: "100% Recycled UK Textiles",
          },
          {
            "@type": "PropertyValue",
            name: "Sustainability",
            value: "Circular Economy Product",
          },
        ],
      }
    : null;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Moenviron Loop",
    url: defaultMeta.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${defaultMeta.url}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={pageUrl} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Moenviron Loop" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />

      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />

      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(webSiteSchema)}</script>
      {productSchema && (
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      )}
    </Helmet>
  );
}
