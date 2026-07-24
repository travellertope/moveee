import { Platform } from 'react-native';

export const lightColors = {
  // Backgrounds & surfaces
  paperWarm:   '#F3ECE0',   // Primary background
  paper:       '#FFFFFF',   // Card surface
  paperDeep:   '#F5F5F5',   // Elevated surface
  community:   '#EDF7ED',   // Community card bg

  // Text
  ink:         '#14110D',   // Primary text
  inkSoft:     '#3A342B',   // Body text
  mute:        '#7A6F5C',   // Secondary text
  ghost:       '#C8BFB0',   // Disabled / hint

  // Borders / rules
  rule:        'rgba(20,17,13,0.10)',
  ruleDark:    'rgba(20,17,13,0.15)',

  // Actions & accents
  ochre:       '#C5491F',   // Primary action
  ochreDark:   '#8A2D10',   // Primary action pressed

  // Pro tier accent
  gold:        '#B38238',
  goldLight:   'rgba(179,130,56,0.10)',
  goldBorder:  'rgba(179,130,56,0.40)',

  // Semantic
  success:     '#2D6A4F',
  error:       '#C62828',
  warning:     '#E65100',

  // Community (green)
  communityBorder: '#81C784',
  communityBg:     '#EDF7ED',
  communityText:   '#2E7D32',

  // Feed type badge colours (from Figma Design System)
  badgePulseBg:      '#FEF3E2',
  badgePulseText:    '#B38238',   // colors.gold
  badgeEditorialBg:  '#FFF0EB',
  badgeEditorialText:'#C5491F',   // colors.ochre
  badgeHappeningBg:  '#EDE9FE',
  badgeHappeningText:'#4C1D95',
  badgeDirectoryBg:  '#E8F5EE',
  badgeDirectoryText:'#085041',
  badgeQuoteBg:      '#FEF3C7',
  badgeQuoteText:    '#78350F',

  // Community post template badge colours (from Figma Design System)
  templateGemBg:       '#FEF3C7',
  templateGemText:     '#92400E',
  templateTakeBg:      '#E0F2FE',
  templateTakeText:    '#075985',
  templateFoodBg:      '#FCE7F3',
  templateFoodText:    '#9D174D',
  templateShowcaseBg:  '#F3E8FF',
  templateShowcaseText:'#6B21A8',
  templateRouteBg:     '#D1FAE5',
  templateRouteText:   '#065F46',
  templatePollBg:      '#EDE9FE',
  templatePollText:    '#4C1D95',
  templateEventBg:     '#FEE2E2',
  templateEventText:   '#991B1B',
  templateBookBg:      '#F0FDF4',
  templateBookText:    '#14532D',
  templateMusicBg:     '#E6FFFA',
  templateMusicText:   '#0D7377',
  templateFilmBg:      '#E8EEF7',
  templateFilmText:    '#2B4C7E',

  // Poll
  pollVoteBg:  'rgba(46,125,50,0.10)',
  pollBorder:  '#E0D8CE',
  pollWinner:  '#2E7D32',
} as const;

// Alias kept for backwards-compat with existing static imports
export const colors = lightColors;

export const darkColors = {
  // Backgrounds & surfaces
  paperWarm:   '#1A1612',
  paper:       '#242018',
  paperDeep:   '#2D2820',
  community:   '#1A2A1A',

  // Text
  ink:         '#F3ECE0',
  inkSoft:     '#D4C9B8',
  mute:        '#9E9288',
  ghost:       '#5C5349',

  // Borders / rules
  rule:        'rgba(61,53,48,0.6)',
  ruleDark:    '#3D3530',

  // Actions & accents
  ochre:       '#D4603A',
  ochreDark:   '#A83F20',

  // Pro tier accent
  gold:        '#C9963F',
  goldLight:   'rgba(201,150,63,0.12)',
  goldBorder:  'rgba(201,150,63,0.35)',

  // Semantic
  success:     '#4ADE80',
  error:       '#F87171',
  warning:     '#FB923C',

  // Community
  communityBorder: '#4ADE80',
  communityBg:     '#0F1F0F',
  communityText:   '#4ADE80',

  // Feed type badge colours
  badgePulseBg:      '#2A2210',
  badgePulseText:    '#C9963F',
  badgeEditorialBg:  '#2A1810',
  badgeEditorialText:'#D4603A',
  badgeHappeningBg:  '#1A1530',
  badgeHappeningText:'#A78BFA',
  badgeDirectoryBg:  '#0F1F15',
  badgeDirectoryText:'#34D399',
  badgeQuoteBg:      '#261E0A',
  badgeQuoteText:    '#FCD34D',

  // Community post template badge colours
  templateGemBg:       '#2A1E08',
  templateGemText:     '#FCD34D',
  templateTakeBg:      '#0A1A2A',
  templateTakeText:    '#60A5FA',
  templateFoodBg:      '#2A0D1E',
  templateFoodText:    '#F472B6',
  templateShowcaseBg:  '#1E0A38',
  templateShowcaseText:'#C084FC',
  templateRouteBg:     '#051A10',
  templateRouteText:   '#34D399',
  templatePollBg:      '#120D38',
  templatePollText:    '#A78BFA',
  templateEventBg:     '#2A0A0A',
  templateEventText:   '#FCA5A5',
  templateBookBg:      '#052E16',
  templateBookText:    '#4ADE80',
  templateMusicBg:     '#042F2E',
  templateMusicText:   '#5EEAD4',
  templateFilmBg:      '#16233A',
  templateFilmText:    '#8FB4E3',

  // Poll
  pollVoteBg:  'rgba(74,222,128,0.10)',
  pollBorder:  '#3D3530',
  pollWinner:  '#4ADE80',
} as const;

// Keys come from lightColors (so a new color added there is automatically
// part of the palette), but values are widened to plain `string` — both
// lightColors and darkColors are `as const`, so each locks every value to
// its own specific hex literal; without this widening, darkColors' literals
// (different from lightColors') fail to structurally satisfy the type.
export type ColorPalette = { [K in keyof typeof lightColors]: string };

export const fonts = {
  serif:           'Fraunces_400Regular',
  serifBold:       'Fraunces_700Bold',
  serifItalic:     'Fraunces_400Regular_Italic',
  serifBoldItalic: 'Fraunces_700Bold_Italic',
  sans:       'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold:   'DMSans_700Bold',
  sansItalic: 'DMSans_400Regular_Italic',
  mono:       'JetBrainsMono_400Regular',
  monoBold:   'JetBrainsMono_700Bold',
  monoItalic: 'JetBrainsMono_400Regular_Italic',
} as const;

// Type scale from Figma Design System
export const fontSize = {
  eyebrow:  9,   // Label/Eyebrow — tracked uppercase
  tiny:    10,
  xs:      11,   // Label/Mono
  sm:      13,   // Body/Small
  base:    15,   // Body/Medium
  md:      17,   // Body/Large
  lg:      22,   // Display/Subtitle
  xl:      28,   // Display/Title
  '2xl':   36,   // Display/Hero
} as const;

export const lineHeight = {
  tight:   1.15,  // Display/Hero
  snug:    1.2,   // Display/Title
  normal:  1.3,   // Display/Subtitle
  relaxed: 1.4,   // Body/Small
  loose:   1.5,   // Body/Medium + Large
} as const;

export const letterSpacing = {
  tracked:  1.5,   // Eyebrow labels (uppercase)
  normal:   0,
  tight:   -0.5,   // Display/Hero
} as const;

export const space = {
   1:  4,
   2:  8,
   3: 12,
   4: 16,
   5: 20,
   6: 24,
   8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm:   2,
  md:   4,
  lg:   6,
  xl:  12,
  '2xl':20,
  full: 9999,
} as const;

// Elevation shadows (from Figma Design System)
export const shadows = {
  card: {
    shadowColor: '#14110D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  modal: {
    shadowColor: '#14110D',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 60,
    elevation: 8,
  },
  fab: {
    shadowColor: '#C5491F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
