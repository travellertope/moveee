import React, { useMemo } from "react";
import RenderHtml from "react-native-render-html";
import { unlazyImages } from "../../utils/unlazyImages";

type RenderHtmlProps = React.ComponentProps<typeof RenderHtml>;
type Props = Omit<RenderHtmlProps, "source"> & { html: string };

/**
 * Renders CMS HTML. Use this instead of importing RenderHtml directly.
 *
 * Every WordPress body arrives with Optimole's lazy-load placeholders in place
 * of real image URLs (see utils/unlazyImages.ts), and Optimole's JS never runs
 * in the app — so the images silently don't render. Funnelling every HTML
 * surface through one component means a new surface can't reintroduce that bug,
 * which is the same reason the web copy lives inside sanitizeHtml() rather than
 * at each call site.
 *
 * All other RenderHtml props (tagsStyles, renderersProps, ignoredDomTags, …)
 * pass straight through.
 */
export default function HtmlContent({ html, ...rest }: Props) {
  const source = useMemo(() => ({ html: unlazyImages(html ?? "") }), [html]);
  return <RenderHtml {...rest} source={source} />;
}
