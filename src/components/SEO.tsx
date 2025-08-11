import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title: string;
  description?: string;
}

export default function SEO({ title, description }: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (description) {
      if (metaDesc) metaDesc.setAttribute("content", description);
      else {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        m.setAttribute("content", description);
        document.head.appendChild(m);
      }
    }

    const canonicalHref = window.location.origin + location.pathname;
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalHref;
  }, [title, description, location.pathname]);

  return null;
}
