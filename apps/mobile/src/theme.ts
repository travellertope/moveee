import { Platform } from 'react-native';

export const colors = {
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
  badgePulseBg:      '#14110D',
  badgePulseText:    '#FFFFFF',
  badgeEditorialBg:  '#F3ECE0',
  badgeEditorialText:'#14110D',
  badgeHappeningBg:  '#EDE9FE',
  badgeHappeningText:'#4C1D95',
  badgeDirectoryBg:  '#EDF7ED',
  badgeDirectoryText:'#065F46',
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

  // Poll
  pollVoteBg:  'rgba(46,125,50,0.10)',
  pollBorder:  '#E0D8CE',
  pollWinner:  '#2E7D32',
} as const;

export const fonts = {
  serif:      'Fraunces_400Regular',
  serifBold:  'Fraunces_700Bold',
  sans:       'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold:   'DMSans_700Bold',
  mono:       'JetBrainsMono_400Regular',
  monoBold:   'JetBrainsMono_700Bold',
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
