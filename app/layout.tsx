import type { Metadata } from "next";
import { pageMetadata, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/site-config";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollRevealController } from "@/components/scroll-reveal-controller";
import "./globals.css";
import "./footer.css";
import "./scientific.css";
import "./motion.css";
import "./comments.css";

export const metadata: Metadata = {
  ...pageMetadata(SITE_NAME, SITE_DESCRIPTION, "/"),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: { default: SITE_NAME, template: "%s | Museo de Patología Veterinaria" },
  description: SITE_DESCRIPTION,
  icons: {
    icon: { url: "/favicon-logo.png", type: "image/png", sizes: "48x48" },
    shortcut: "/favicon-logo.png",
    apple: { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head><noscript><style>{`.case-workspace [role="tabpanel"][hidden], .scientific-study p[hidden] { display: block !important; } .case-workspace [role="tabpanel"] { margin-bottom: 3rem; } .case-tabbar, .scientific-study button { display: none !important; }`}</style></noscript><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" /></head>
      <body className="antialiased"><JsonLd data={{ "@context": "https://schema.org", "@graph": [{ "@type": "Museum", "@id": `${SITE_URL}/#museum`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png`, description: SITE_DESCRIPTION, email: "museodepatologiaveterinaria@gmail.com", address: { "@type": "PostalAddress", streetAddress: "Av. Universitaria", addressLocality: "Cajamarca", addressCountry: "PE" }, parentOrganization: { "@type": "CollegeOrUniversity", name: "Universidad Nacional de Cajamarca" } }, { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, inLanguage: "es-PE", publisher: { "@id": `${SITE_URL}/#museum` } }] }} /><a href="#contenido" className="skip-link">Saltar al contenido</a><SiteHeader /><div id="contenido">{children}</div><SiteFooter /><ScrollRevealController /></body>
    </html>
  );
}
