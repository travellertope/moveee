import React, { useMemo } from "react";
import RenderHtml, {
  defaultFallbackFonts,
  defaultSystemFonts,
} from "react-native-render-html";
import { unlazyImages } from "../../utils/unlazyImages";

type RenderHtmlProps = React.ComponentProps<typeof RenderHtml>;
type Props = Omit<RenderHtmlProps, "source"> & { html: string };

/**
 * react-native-render-html 6.3.4 supplies its render-engine configuration via
 * `TRenderEngineProvider.defaultProps`. React 19 ignores defaultProps on
 * function components, and RenderHTML spreads our props straight into that
 * provider without adding any defaults of its own — so on SDK 57 the engine
 * would receive `undefined` for emSize, baseStyle, enableUserAgentStyles and
 * the rest, losing all base typography and user-agent styling (bold, headings,
 * lists) across every article and pulse body.
 *
 * 6.3.4 is both our version and the newest published — the library is
 * abandoned, so there is no upgrade and these values can never drift. Rather
 * than patch node_modules (fragile under workspace hoisting, and easy to lose
 * on a reinstall), we re-supply them here, ahead of `rest` so any caller
 * override still wins exactly as it did before.
 *
 * Deliberately NOT re-supplied, having checked each one: the defaultProps on
 * TChildrenRenderer and TNodeChildrenRenderer are redundant (renderChildren
 * already destructures `propsForChildren = empty`), and TNodeRenderer's
 * `propsFromParent` default is benign — its only consumer reads it with
 * optional chaining, and mergeCollapsedMargins treats undefined and null
 * identically.
 */
const RENDER_ENGINE_DEFAULTS: Partial<RenderHtmlProps> = {
  htmlParserOptions: { decodeEntities: true },
  emSize: 14,
  ignoredDomTags: [],
  ignoredStyles: [],
  baseStyle: { fontSize: 14 },
  tagsStyles: {},
  classesStyles: {},
  enableUserAgentStyles: true,
  enableCSSInlineProcessing: true,
  customHTMLElementModels: {},
  fallbackFonts: defaultFallbackFonts,
  systemFonts: defaultSystemFonts,
};

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
  return <RenderHtml {...RENDER_ENGINE_DEFAULTS} {...rest} source={source} />;
}
