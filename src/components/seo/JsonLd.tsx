interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Renders structured data. Content is our own static data; `<` is escaped so
 * a string can never terminate the script element.
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
