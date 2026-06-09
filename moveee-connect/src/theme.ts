import { Platform } from 'react-native';

export const colors = {
  // Backgrounds
  paper:       '#ffffff',
  paperDeep:   '#f5f5f5',
  paperWarm:   '#f3ece0',

  // Text
  ink:         '#14110d',
  inkSoft:     '#3a342b',
  mute:        '#7a6f5c',
  ghost:       '#c8bfb0',

  // Borders / rules
  rule:        '#e8e2d8',
  ruleDark:    'rgba(42,36,28,0.15)',

  // Accent — primary actions
  ochre:       '#c5491f',
  ochreDark:   '#8a2d10',

  // Accent — patron / gold
  gold:        '#b38238',
  goldLight:   'rgba(179,130,56,0.10)',
  goldBorder:  'rgba(179,130,56,0.40)',

  // Community (green)
  communityBorder: '#81c784',
  communityBg:     '#edf7ed',
  communityText:   '#2e7d32',

  // Type badge backgrounds
  badgePulseBg:      '#fef3e2',
  badgePulseText:    '#b38238',
  badgeEditorialBg:  '#fff0eb',
  badgeEditorialText:'#c5491f',
  badgeHappeningBg:  '#eeedfe',
  badgeHappeningText:'#3c3489',
  badgeDirectoryBg:  '#e8f5ee',
  badgeDirectoryText:'#085041',
  badgeQuoteBg:      '#f3eef8',
  badgeQuoteText:    '#7a4da0',

  // Template badge colours
  templateGemBg:       'rgba(179,130,56,0.10)',
  templateGemText:     '#b38238',
  templateTakeBg:      'rgba(107,72,168,0.08)',
  templateTakeText:    '#6b48a8',
  templateFoodBg:      'rgba(197,73,31,0.08)',
  templateFoodText:    '#c5491f',
  templateShowcaseBg:  'rgba(25,118,210,0.08)',
  templateShowcaseText:'#1976d2',
  templateRouteBg:     'rgba(46,125,50,0.08)',
  templateRouteText:   '#2e7d32',

  // Poll
  pollVoteBg:  'rgba(46,125,50,0.10)',
  pollBorder:  '#e0d8ce',
  pollWinner:  '#2e7d32',
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

export const fontSize = {
  eyebrow: 9,
  tiny:   10,
  xs:     11,
  sm:     12,
  base:   14,
  md:     16,
  lg:     18,
  xl:     22,
  '2xl':  28,
  '3xl':  36,
} as const;

export const letterSpacing = {
  tracked: 1.2,
  normal:  0,
  tight:  -0.3,
} as const;

export const space = {
   1:  4,
   2:  8,
   3: 12,
   4: 16,
   5: 20,
   6: 24,
   7: 28,
   8: 32,
   9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

export const radius = {
  sm:   2,
  md:   4,
  lg:   6,
  full: 9999,
} as const;
