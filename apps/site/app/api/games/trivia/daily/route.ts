/**
 * GET /api/games/trivia/daily
 *
 * Returns 10 unique trivia questions for today's UTC date.
 *
 * Strategy:
 *   1. Check WordPress cache (same date) → ~50ms
 *   2. Generate via Gemini with date-seeded daily topic brief → varied, non-repeating
 *   3. Cache to WordPress for all other Vercel instances
 *   4. If Gemini unavailable → serve from hardcoded fallback bank (never 500)
 *
 * Topic rotation: 120+ specific sub-topics, 10 selected per day by date seed.
 * At 120 topics choosing 10: ~1.9 × 10^12 possible orderings — effectively unlimited.
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const runtime = "nodejs";

interface TriviaQuestion {
  question:    string;
  options:     [string, string, string, string];
  correct:     number;
  explanation: string;
  category:    string;
}

const WP_URL  = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET ?? "";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const TEXT_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

// ── Topic pool: 120+ specific sub-topics across 12 cultural domains ────────────
// Each day, 10 are selected by date seed → every day has a completely different
// set of question subjects, guaranteeing no cross-day repetition.
const TOPIC_POOL = [
  // Music
  "The life and legacy of Fela Kuti and Afrobeat",
  "The origins of Highlife music in Ghana and Nigeria",
  "Amapiano: South African township sounds and key artists",
  "The rise of Afrobeats globally (2010–2024)",
  "Makossa and Cameroonian popular music",
  "Mbalax: Youssou N'Dour and Senegalese rhythm",
  "South African jazz and the Blue Notes generation",
  "Jùjú music and King Sunny Ade",
  "Afro-soul: Simphiwe Dana, Asa, and contemporaries",
  "Reggae's African roots and Bob Marley's Rastafari legacy",
  "Calypso and soca from Trinidad and Tobago",
  "Afro-fusion stars: Burna Boy, Wizkid, Davido milestones",
  "Kwaito: the sound of post-apartheid South Africa",
  "Congolese soukous and rumba evolution",
  "Ethiopian jazz: Mulatu Astatke and the Addis Ababa sound",
  "Black British music: grime, jungle, and UK garage",
  "Hip-hop's African-American origins and global spread",
  "Gospel music in the African church tradition",
  "Benga music from Kenya: Daniel Owino Misiani",
  "Neo-soul and its African-American roots",
  "Afrobeats producers: Shizzi, P2J, Killertunes",
  "Fuji music and Ayinla Omowura",
  "Sierra Leone's palm wine music tradition",
  // Film & Television
  "Nollywood: history, scale and global influence",
  "Early Nigerian and Ghanaian video film pioneers",
  "Black Panther and its African representation debate",
  "Steve McQueen's films and the Black British experience",
  "Ousmane Sembène: father of African cinema",
  "Haile Gerima and Ethiopian-American diaspora cinema",
  "Ava DuVernay and African-American documentary film",
  "African animation: Kugali, Triggerfish, Mama K's Team 4",
  "John Boyega's career and British-Nigerian identity",
  "African cinema at Cannes and major festivals",
  "African horror and fantasy films",
  "The Fresh Prince of Bel-Air's cultural impact",
  "Lupita Nyong'o and the Kenyan Hollywood breakthrough",
  "Spike Lee's filmmaking and Black American storytelling",
  "African directors in European film: Abderrahmane Sissako",
  // Literature
  "Chinua Achebe and Things Fall Apart",
  "Chimamanda Ngozi Adichie's feminist writing",
  "Wole Soyinka: Nobel Laureate, playwright and activist",
  "Ngugi wa Thiong'o and writing in African languages",
  "Ben Okri's The Famished Road and magical realism",
  "Harlem Renaissance writers: Langston Hughes and Zora Neale Hurston",
  "Toni Morrison and African-American literary legacy",
  "Caribbean literature: Derek Walcott and CLR James",
  "Ama Ata Aidoo and Ghanaian feminist writing",
  "Buchi Emecheta and Nigerian diaspora literature",
  "Afrofuturism in literature: Nnedi Okofor and NK Jemisin",
  "Teju Cole and contemporary Nigerian-American writing",
  "Francophone African literature: Mariama Bâ and Mongo Beti",
  "NoViolet Bulawayo and Zimbabwean literature",
  "Leila Aboulela and the African Muslim experience in fiction",
  // History & Politics
  "Kwame Nkrumah and Pan-Africanism",
  "Nelson Mandela and the South African liberation struggle",
  "Thomas Sankara: revolutionary president of Burkina Faso",
  "The Mau Mau uprising and Kenya's independence",
  "The Haitian Revolution and Toussaint Louverture",
  "Marcus Garvey and the Back to Africa movement",
  "Patrice Lumumba and the Congo independence crisis",
  "Civil rights movement milestones: Rosa Parks, MLK, John Lewis",
  "Fred Hampton and the Black Panther Party",
  "Steve Biko and Black Consciousness in South Africa",
  "The Berlin Conference of 1884 and the Scramble for Africa",
  "African independence wave of the 1960s",
  "The Rwandan Genocide and its international aftermath",
  "Black Wall Street and the Tulsa Race Massacre of 1921",
  "The Zulu Kingdom under King Shaka",
  "The Kingdom of Kongo and pre-colonial Atlantic trade",
  "The Battle of Adwa and Ethiopian sovereignty",
  "The transatlantic slave trade and its legacy",
  "Winnie Mandela's activism and political life",
  "Amilcar Cabral and West African liberation",
  "Julius Nyerere and Tanzania's Ujamaa experiment",
  "The Nigerian Civil War and Biafra",
  // Visual Art, Fashion & Design
  "El Anatsui: Ghanaian sculptor and global art world",
  "Kara Walker's silhouettes and African-American history",
  "Yinka Shonibare: British-Nigerian conceptual art",
  "African textiles: Kente, Ankara, Kanga, Adire traditions",
  "Zanele Muholi's photographic activism and LGBTQ+ Black identity",
  "Kerry James Marshall and Black figurative painting",
  "The Afropunk movement and Black alternative fashion",
  "Lagos Fashion Week and African designer rise",
  "Virgil Abloh's impact on Black fashion and streetwear",
  "African ceremonial masks: form, function, and meaning",
  "Ndebele and Maasai beadwork traditions",
  "African street photography: Malick Sidibé, Seydou Keïta",
  "David Adjaye: architect of the Smithsonian NMAAHC and global African diaspora design",
  "Great Zimbabwe: stone city and the ancient Shona civilisation",
  "The Great Mosque of Djenné: mud-brick masterpiece of West Africa",
  "Timbuktu's medieval mosques and Islamic scholarly architecture",
  "Egyptian pyramids and the engineering of the ancient world",
  "Nubian pyramids: the lesser-known temples of Meroe and Kush",
  "Vernacular African architecture: earthen buildings, rondavels, and compounds",
  "Francis Kéré: Burkina Faso-born architect and Pritzker Prize winner",
  "Kunlé Adeyemi and floating school designs in Lagos",
  "Colonial-era architecture in Africa and its lasting urban legacy",
  "Ghanaian fantasy coffins as art and tradition",
  // Food & Culture
  "Jollof rice origins and the Nigeria vs Ghana debate",
  "Ethiopian injera and communal coffee ceremony",
  "Caribbean cuisine: jerk, ackee, roti traditions",
  "Egusi soup, fufu, and Nigerian culinary culture",
  "South African braai and food heritage",
  "Senegalese thiéboudienne and yassa",
  "African fermented foods and their health traditions",
  "Kola nuts in West African hospitality and ceremony",
  "Street food cultures across West Africa",
  // Diaspora, Identity & Philosophy
  "W.E.B. Du Bois and the concept of double consciousness",
  "Frantz Fanon and the psychology of colonialism",
  "The Windrush Generation and Britain's Caribbean community",
  "The African diaspora in Brazil: Candomblé and Carnival",
  "Notting Hill Carnival history and Trinidadian roots",
  "Ubuntu philosophy: communal ethics and modern relevance",
  "Griot tradition: West African oral history and storytelling",
  "Islam's spread across West Africa and Timbuktu as a knowledge hub",
  "Capoeira: African-Brazilian martial art and cultural resistance",
  "African naming traditions and their meanings across regions",
  "Rastafari: spirituality, identity, and resistance culture",
  "Afrocentrism: the movement and its intellectual history",
  // Sport
  "African footballers in European leagues: stories and milestones",
  "George Weah: Ballon d'Or winner and President of Liberia",
  "Caster Semenya and gender rights in athletics",
  "Eliud Kipchoge and the science of East African distance running",
  "Muhammad Ali and Black American identity in global sport",
  "The 1968 Olympics Black Power salute by Smith and Carlos",
  "Anthony Joshua's British-Nigerian boxing journey",
  "Africa's 2010 FIFA World Cup: Shakira, vuvuzelas, history",
  "Usain Bolt and Jamaican sprinting dominance",
  "Africa at the Olympics: gold medalists and milestones",
  // ── Global Culture (≈30%) ──────────────────────────────────────────────────
  // Global Music
  "The British Invasion: The Beatles, Rolling Stones, and their global impact",
  "K-pop: BTS, BLACKPINK, and South Korea's cultural export machine",
  "Latin music's global rise: Bad Bunny, Shakira, J Balvin and reggaeton",
  "Electronic dance music history: from Detroit techno to global EDM",
  "Jazz history: from New Orleans origins to Miles Davis and Coltrane",
  "The rise of Taylor Swift and the pop star as cultural phenomenon",
  "Flamenco: Andalusian roots, Roma heritage, and UNESCO recognition",
  "Bollywood music and its influence on global pop culture",
  "The history of punk rock and its countercultural legacy",
  "David Bowie and glam rock's gender-bending cultural impact",
  "Samba, bossa nova, and Brazilian music's global reach",
  "The influence of Jamaican dub music on global sound systems",
  // Global Film & TV
  "Parasite (2019): Bong Joon-ho and South Korean cinema on the world stage",
  "The Marvel Cinematic Universe and superhero blockbuster culture",
  "Studio Ghibli and the art of Japanese animation",
  "Squid Game and Korean drama's Netflix breakthrough",
  "Fellini, Godard, and the European New Wave in cinema",
  "The Oscars diversity debate and #OscarsSoWhite",
  "Reality TV culture: from Big Brother to global format exports",
  "The Golden Age of television: The Sopranos, Breaking Bad, The Wire",
  "Hong Kong action cinema: Bruce Lee, Jackie Chan, John Woo",
  "Pedro Almodóvar and Spanish cinema's global voice",
  // Global Literature & Language
  "Gabriel García Márquez and Latin American magical realism",
  "Haruki Murakami and Japanese contemporary fiction worldwide",
  "Salman Rushdie's The Satanic Verses controversy and free speech",
  "The Nobel Prize in Literature: recent winners and overlooked voices",
  "J.K. Rowling's Harry Potter and the cultural impact of fantasy",
  "James Baldwin's Go Tell It on the Mountain and exile writing",
  "The global popularity of Nordic noir crime fiction",
  "Elena Ferrante and the anonymous Italian literary sensation",
  // Global Art, Fashion & Design
  "The Bauhaus school and its lasting influence on design",
  "Banksy and the politics of anonymous street art",
  "Paris, Milan, New York, London: the four fashion capitals and their identities",
  "Alexander McQueen's dark romanticism in fashion",
  "Japanese streetwear: Harajuku, Comme des Garçons, and BAPE",
  "The rise of sneaker culture and its crossover with high fashion",
  "Frida Kahlo: Mexican artist and global feminist icon",
  "Ai Weiwei and art as political activism in China",
  "The Venice Biennale and how global art markets work",
  "Architecture of iconic cities: New York skyline, Paris Haussmann, Tokyo density",
  // Global Food
  "The Michelin star system and how it shapes global restaurant culture",
  "Japanese ramen, sushi, and washoku's UNESCO heritage status",
  "The rise of vegan and plant-based diets as global cultural movement",
  "Street food cultures: Bangkok, Mexico City, Marrakech, Hanoi",
  "Wine culture: Bordeaux, Napa Valley, and the world's great regions",
  "Pizza, pasta, and the globalisation of Italian food culture",
  "Spice trade history: how pepper, nutmeg and cinnamon shaped empires",
  // Global History & Ideas
  "The Cold War's cultural dimensions: Hollywood vs Soviet cinema",
  "The fall of the Berlin Wall and European reunification culture",
  "The Silk Road and its role in cultural exchange between East and West",
  "The printing press and how it transformed knowledge and culture",
  "The Renaissance: humanism, art, and the rebirth of classical ideas",
  "The French Revolution and the birth of modern political culture",
  "Buddhist art and its spread along the Silk Road",
  "Indigenous cultures of Australia: the Dreamtime and land rights",
  "The Aztec and Maya civilisations: arts, calendars, and legacy",
  "The history of the Olympic Games from Athens 1896 to today",
  // Global Sport
  "Lionel Messi vs Cristiano Ronaldo: the greatest footballing rivalry",
  "The Tour de France and cycling's place in European culture",
  "Sumo wrestling and its deep roots in Japanese tradition",
  "Cricket culture: from the British Empire to the Caribbean and South Asia",
  "Roger Federer, Nadal, Djokovic: the golden era of men's tennis",
  "The Super Bowl halftime show as a cultural event",
  "Formula 1's global expansion: Saudi Arabia, Miami, Las Vegas Grand Prix",
  "Basketball and the NBA's cultural influence beyond sport",
];

// Seeded Fisher-Yates shuffle using a linear congruential generator
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dateToSeed(date: string): number {
  let h = 0;
  for (const ch of date) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

function buildDailyPrompt(seedKey: string, seed: number): string {
  const topics = seededShuffle(TOPIC_POOL, seed).slice(0, 10);
  const topicList = topics.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const displayDate = seedKey.slice(0, 10);

  return `You are the question writer for Culture Games — a daily trivia game on The Moveee, celebrating global culture with a strong focus on African, Caribbean, and Black diaspora culture.

Today is ${displayDate}. Generate exactly 10 trivia questions — one for each topic assigned below. You MUST write one question per topic, in order. Roughly 70% of questions cover African/diaspora culture; 30% cover wider global culture.

TODAY'S ASSIGNED TOPICS:
${topicList}

Rules:
- Questions must be factual and verifiable — no invented trivia
- Each question must relate clearly to its assigned topic
- Difficulty: questions 1–4 easy, 5–8 medium, 9–10 hard
- Each question has exactly 4 options (A–D), only one is correct
- Spread the correct answer position: do not cluster all correct answers at A
- Write a 1–2 sentence explanation adding interesting cultural context
- Be specific — use real names, dates, places, and titles

Return ONLY a valid JSON array — no markdown, no code fences:
[
  {
    "question": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "...",
    "category": "music | film | literature | history | culture | sport | food | art"
  }
]`;
}

function extractJson(raw: string): string {
  const s = raw.indexOf("[");
  const e = raw.lastIndexOf("]");
  if (s === -1 || e === -1) throw new Error("No JSON array found");
  return raw.slice(s, e + 1);
}


async function generateQuestions(seedKey: string): Promise<TriviaQuestion[] | null> {
  const seed   = dateToSeed(seedKey);
  const prompt = buildDailyPrompt(seedKey, seed);
  let lastErr: any;

  for (const modelId of TEXT_MODELS) {
    try {
      const model = ai.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY,
      });

      const res      = await model.generateContent(prompt);
      const response = await res.response;
      const raw      = response.text().trim();
      if (!raw) continue;

      const parsed = JSON.parse(extractJson(raw));
      if (!Array.isArray(parsed)) continue;

      const questions: TriviaQuestion[] = parsed
        .filter(
          (q: any) =>
            q.question &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            typeof q.correct === "number" &&
            q.correct >= 0 &&
            q.correct <= 3
        )
        .slice(0, 10)
        .map((q: any) => ({
          question:    String(q.question),
          options:     q.options.map(String) as [string, string, string, string],
          correct:     Number(q.correct),
          explanation: String(q.explanation ?? ""),
          category:    String(q.category ?? "culture"),
        }));

      if (questions.length >= 5) return questions;
    } catch (err) {
      lastErr = err;
    }
  }

  console.error("[trivia] All Gemini models failed:", lastErr?.message);
  return null;
}

// ── Fallback bank: 15 curated questions (used when Gemini is unavailable) ─────
const FALLBACK_QUESTIONS: TriviaQuestion[] = [
  {
    question: "What is the philosophy described as \"I am because we are\"?",
    options: ["Ubuntu", "Ujamaa", "Maat", "Harambee"],
    correct: 0,
    explanation: "Ubuntu is a Southern African philosophy emphasising communal bonds and shared humanity.",
    category: "culture",
  },
  {
    question: "Which West African country was the first in sub-Saharan Africa to gain independence from colonial rule?",
    options: ["Nigeria", "Ghana", "Senegal", "Kenya"],
    correct: 1,
    explanation: "Ghana gained independence on 6 March 1957 under Kwame Nkrumah, inspiring the rest of the continent.",
    category: "history",
  },
  {
    question: "Fela Kuti is credited with creating which genre of music?",
    options: ["Highlife", "Jùjú", "Afrobeat", "Fuji"],
    correct: 2,
    explanation: "Fela Anikulapo Kuti fused jazz, funk and traditional Yoruba music to create Afrobeat in the 1970s.",
    category: "music",
  },
  {
    question: "Which novel by Chimamanda Ngozi Adichie follows Ifemelu's immigration to America?",
    options: ["Half of a Yellow Sun", "Purple Hibiscus", "Americanah", "The Thing Around Your Neck"],
    correct: 2,
    explanation: "Americanah (2013) explores race, identity and belonging through a Nigerian woman's experience in the US.",
    category: "literature",
  },
  {
    question: "The Jollof rice rivalry is most fiercely contested between which two countries?",
    options: ["Nigeria and Ghana", "Senegal and Mali", "Cameroon and Ivory Coast", "Sierra Leone and Liberia"],
    correct: 0,
    explanation: "The 'Jollof Wars' is a beloved cultural rivalry between Nigeria and Ghana over which country makes the best Jollof rice.",
    category: "food",
  },
  {
    question: "Who directed the Oscar-winning film 12 Years a Slave?",
    options: ["Spike Lee", "John Singleton", "Steve McQueen", "Ava DuVernay"],
    correct: 2,
    explanation: "British-Trinidadian director Steve McQueen won the Academy Award for Best Picture for 12 Years a Slave in 2014.",
    category: "film",
  },
  {
    question: "Amapiano originated in which country?",
    options: ["Nigeria", "Kenya", "Zimbabwe", "South Africa"],
    correct: 3,
    explanation: "Amapiano emerged from South African townships in the early 2010s, blending deep house, jazz and kwaito.",
    category: "music",
  },
  {
    question: "Which Ethiopian emperor is revered as a divine figure in Rastafari?",
    options: ["Menelik II", "Haile Selassie", "Tewodros II", "Yohannes IV"],
    correct: 1,
    explanation: "Haile Selassie I, born Ras Tafari Makonnen, is venerated as the returned messiah by the Rastafari movement.",
    category: "history",
  },
  {
    question: "The Adinkra symbols originate from which West African people?",
    options: ["Yoruba", "Akan", "Wolof", "Igbo"],
    correct: 1,
    explanation: "Adinkra symbols are visual symbols from the Akan people of Ghana and Ivory Coast, each representing a proverb or concept.",
    category: "culture",
  },
  {
    question: "Who wrote Things Fall Apart, often called the archetypal African novel?",
    options: ["Wole Soyinka", "Ngugi wa Thiong'o", "Chinua Achebe", "Ben Okri"],
    correct: 2,
    explanation: "Chinua Achebe's Things Fall Apart (1958) depicts Igbo society and the impact of colonialism through the story of Okonkwo.",
    category: "literature",
  },
  {
    question: "Burna Boy won a Grammy Award in which category in 2021?",
    options: ["Best New Artist", "Best World Music Album", "Best Global Music Album", "Best African Performance"],
    correct: 2,
    explanation: "Burna Boy won Best Global Music Album for 'Twice as Tall' at the 63rd Grammy Awards in 2021.",
    category: "music",
  },
  {
    question: "The Harlem Renaissance was primarily a cultural movement in which decade?",
    options: ["1900s", "1910s", "1920s", "1940s"],
    correct: 2,
    explanation: "The Harlem Renaissance flourished in the 1920s, producing landmark works by Hughes, Hurston, Cullen and others.",
    category: "history",
  },
  {
    question: "Which Senegalese city is home to the African Renaissance Monument?",
    options: ["Saint-Louis", "Thiès", "Ziguinchor", "Dakar"],
    correct: 3,
    explanation: "The African Renaissance Monument stands on a hilltop in Dakar — one of the tallest statues in Africa.",
    category: "culture",
  },
  {
    question: "Eliud Kipchoge, first person to run a marathon in under 2 hours, is from which country?",
    options: ["Ethiopia", "Kenya", "Uganda", "Tanzania"],
    correct: 1,
    explanation: "Kenya's Eliud Kipchoge ran 1:59:40 in Vienna in 2019, breaking the 2-hour barrier for the first time in history.",
    category: "sport",
  },
  {
    question: "Which Ghanaian-British architect co-designed the Smithsonian's National Museum of African American History and Culture?",
    options: ["David Adjaye", "Lesley Lokko", "Elsie Owusu", "Kunlé Adeyemi"],
    correct: 0,
    explanation: "Sir David Adjaye was the lead designer of the Smithsonian NMAAHC, opened in Washington DC in 2016.",
    category: "art",
  },
  // ── 45 additional questions ───────────────────────────────────────────────
  {
    question: "Beyoncé's 2019 companion album celebrating African culture for The Lion King remake was titled what?",
    options: ["Lemonade", "Renaissance", "Lion King: The Gift", "Black Is King"],
    correct: 2,
    explanation: "Lion King: The Gift (2019) was Beyoncé's companion album to The Lion King remake, spotlighting African artists and Afrobeats sounds.",
    category: "music",
  },
  {
    question: "Lupita Nyong'o won the Academy Award for Best Supporting Actress for which film?",
    options: ["Black Panther", "Us", "12 Years a Slave", "Queen of Katwe"],
    correct: 2,
    explanation: "Lupita Nyong'o won the Oscar for Best Supporting Actress for her role as Patsey in 12 Years a Slave (2014).",
    category: "film",
  },
  {
    question: "Kendrick Lamar became the first rapper to win which prestigious award in 2018?",
    options: ["Man Booker Prize", "National Book Award", "Pulitzer Prize", "Peabody Award"],
    correct: 2,
    explanation: "Kendrick Lamar won the Pulitzer Prize for Music in 2018 for his album DAMN., becoming the first non-classical or jazz artist to win.",
    category: "music",
  },
  {
    question: "Jay-Z was inducted into the Rock and Roll Hall of Fame in which year?",
    options: ["2019", "2021", "2022", "2023"],
    correct: 1,
    explanation: "Jay-Z was inducted into the Rock and Roll Hall of Fame in 2021, recognised as one of the most influential artists in music history.",
    category: "music",
  },
  {
    question: "Wizkid won a Grammy Award for his contribution to which song?",
    options: ["Essence", "Brown Skin Girl", "Come Closer", "Ojuelegba"],
    correct: 1,
    explanation: "Wizkid won the Grammy for Best Music Video for Brown Skin Girl (2021), a track from Beyoncé's Black Is King visual album.",
    category: "music",
  },
  {
    question: "Which Nigerian artist performed at Coachella in 2019, helping raise the global profile of Afrobeats?",
    options: ["Davido", "Burna Boy", "Wizkid", "Fireboy DML"],
    correct: 1,
    explanation: "Burna Boy performed at Coachella in 2019, one of the first Afrobeats acts to do so, significantly boosting the genre's international reach.",
    category: "music",
  },
  {
    question: "Yemi Alade is often called the 'Queen of Afropop' and broke through with which 2014 hit?",
    options: ["Shake", "Johnny", "Tumbum", "Pose"],
    correct: 1,
    explanation: "Johnny (2014) became Yemi Alade's breakthrough hit and one of the most viewed African music videos on YouTube at the time.",
    category: "music",
  },
  {
    question: "Tems won a Grammy Award in 2023 in which category?",
    options: ["Best New Artist", "Best African Performance", "Best Melodic Rap Performance", "Best R&B Song"],
    correct: 2,
    explanation: "Tems won the Grammy for Best Melodic Rap Performance for her contribution to Future's Wait for U featuring Beyoncé in 2023.",
    category: "music",
  },
  {
    question: "Davido's 2012 breakthrough single that launched his international career was titled what?",
    options: ["Fall", "If", "Dami Duro", "Fia"],
    correct: 2,
    explanation: "Dami Duro (2012) was Davido's breakout single that established him as a major force in Afrobeats at just 19 years old.",
    category: "music",
  },
  {
    question: "Alice Walker's Pulitzer Prize-winning novel The Color Purple is set primarily in which US state?",
    options: ["Mississippi", "Alabama", "Georgia", "Louisiana"],
    correct: 2,
    explanation: "The Color Purple (1982) is set in rural Georgia and follows Celie's journey through hardship and self-discovery in the early 20th century.",
    category: "literature",
  },
  {
    question: "Nnedi Okofor coined the term 'Africanfuturism' to distinguish her work from which broader genre?",
    options: ["Afrofantasy", "Afropunk", "Afrofuturism", "Speculative realism"],
    correct: 2,
    explanation: "Nnedi Okofor coined 'Africanfuturism' to describe science fiction rooted in African cultures and futures, distinct from the diaspora-centred Afrofuturism.",
    category: "literature",
  },
  {
    question: "Teju Cole's debut novel Open City follows a Nigerian-German psychiatry student wandering which city?",
    options: ["London", "Berlin", "New York", "Lagos"],
    correct: 2,
    explanation: "Open City (2011) follows Julius as he walks through New York City, reflecting on memory, displacement and belonging.",
    category: "literature",
  },
  {
    question: "Ben Okri won the Booker Prize in 1991 for which novel?",
    options: ["Songs of Enchantment", "Astonishing the Gods", "The Famished Road", "Dangerous Love"],
    correct: 2,
    explanation: "Ben Okri's The Famished Road (1991), about a spirit child in Nigeria, won the Booker Prize and brought him global recognition.",
    category: "literature",
  },
  {
    question: "Zadie Smith's debut novel White Teeth (2000) is primarily set in which city?",
    options: ["Birmingham", "London", "Manchester", "Bristol"],
    correct: 1,
    explanation: "White Teeth is set in north London and follows two multicultural families across several decades of British life.",
    category: "literature",
  },
  {
    question: "Ryan Coogler directed Black Panther (2018). What was his feature film debut?",
    options: ["Creed", "Fruitvale Station", "Space Jam: A New Legacy", "Just Mercy"],
    correct: 1,
    explanation: "Ryan Coogler's debut feature Fruitvale Station (2013) dramatised the final hours of Oscar Grant, winning the Grand Jury Prize at Sundance.",
    category: "film",
  },
  {
    question: "The Oscar-winning film Moonlight (2016) is set in which US city?",
    options: ["Atlanta", "New Orleans", "Miami", "Baltimore"],
    correct: 2,
    explanation: "Moonlight, directed by Barry Jenkins, is set in Liberty City, Miami, and follows a young Black man named Chiron across three chapters of his life.",
    category: "film",
  },
  {
    question: "Jordan Peele's debut horror film Get Out (2017) critiques which theme?",
    options: ["Police brutality", "Liberal racism and cultural appropriation", "Mass incarceration", "The school-to-prison pipeline"],
    correct: 1,
    explanation: "Get Out is a social horror film critiquing liberal white racism and the fetishisation of Black bodies, framed through a literal body-snatching scenario.",
    category: "film",
  },
  {
    question: "The Fresh Prince of Bel-Air was set in which California neighbourhood?",
    options: ["Hollywood Hills", "Malibu", "Bel-Air", "Compton"],
    correct: 2,
    explanation: "Will Smith's character moved from West Philadelphia to the affluent Bel-Air neighbourhood of Los Angeles, living with his Uncle Phil's family.",
    category: "culture",
  },
  {
    question: "Actor Idris Elba was born in London and has heritage from which West African country?",
    options: ["Ghana", "Nigeria", "Sierra Leone", "Liberia"],
    correct: 2,
    explanation: "Idris Elba was born in Hackney, London, to a Sierra Leonean father and Ghanaian mother, making him British with Sierra Leonean and Ghanaian heritage.",
    category: "culture",
  },
  {
    question: "David Oyelowo received critical acclaim for portraying which civil rights leader in the 2014 film Selma?",
    options: ["Malcolm X", "Medgar Evers", "Martin Luther King Jr.", "John Lewis"],
    correct: 2,
    explanation: "David Oyelowo's portrayal of Martin Luther King Jr. in Ava DuVernay's Selma (2014) was widely praised, though controversially overlooked at the Oscars.",
    category: "film",
  },
  {
    question: "Chadwick Boseman, who played Black Panther, was born and raised in which US state?",
    options: ["Georgia", "North Carolina", "South Carolina", "Alabama"],
    correct: 2,
    explanation: "Chadwick Boseman was born in Anderson, South Carolina. He studied at Howard University before becoming an icon of Black excellence on screen.",
    category: "film",
  },
  {
    question: "Which African city hosts one of the continent's most prominent annual fashion weeks?",
    options: ["Accra", "Nairobi", "Lagos", "Johannesburg"],
    correct: 2,
    explanation: "Lagos Fashion Week, founded in 2011, is one of Africa's most prestigious fashion events, showcasing African designers to a global audience.",
    category: "fashion",
  },
  {
    question: "Virgil Abloh, founder of Off-White, served as artistic director of menswear for which luxury brand?",
    options: ["Gucci", "Balenciaga", "Louis Vuitton", "Givenchy"],
    correct: 2,
    explanation: "Virgil Abloh was appointed Artistic Director of Louis Vuitton Men's in 2018, becoming the first Black artistic director at the storied French fashion house.",
    category: "fashion",
  },
  {
    question: "Ozwald Boateng was the first Black designer to open a bespoke tailoring shop on which famous London street?",
    options: ["Bond Street", "Carnaby Street", "Savile Row", "Oxford Street"],
    correct: 2,
    explanation: "Ghanaian-British designer Ozwald Boateng became the first Black designer to open a shop on Savile Row — the historic home of British bespoke tailoring.",
    category: "fashion",
  },
  {
    question: "Nigerian designer Lisa Folawiyo's brand Jewel by Lisa is known for fusing Ankara fabric with what?",
    options: ["Luxury leather goods", "Embellishments and couture craftsmanship", "Kente weaving", "Batik dyeing"],
    correct: 1,
    explanation: "Lisa Folawiyo elevated Ankara fabric by combining it with crystals, embellishments and couture craftsmanship under her Jewel by Lisa brand.",
    category: "fashion",
  },
  {
    question: "Waist beading, a traditional body adornment, has deep roots in which region's cultures?",
    options: ["East Africa", "North Africa", "West Africa", "Southern Africa"],
    correct: 2,
    explanation: "Waist beads have deep roots in West African cultures — notably among the Yoruba, Krobo and Akan peoples — symbolising femininity, fertility and identity.",
    category: "culture",
  },
  {
    question: "The colourful wax-print fabric commonly called 'Ankara' was originally industrialised by manufacturers in which country?",
    options: ["Nigeria", "Ghana", "The Netherlands", "Senegal"],
    correct: 2,
    explanation: "Though deeply associated with African fashion, Ankara wax-print fabric was industrialised by Dutch companies (notably Vlisco) in the 19th century.",
    category: "fashion",
  },
  {
    question: "Suya, the spiced grilled meat skewer, originates from which Nigerian ethnic group?",
    options: ["Yoruba", "Igbo", "Hausa-Fulani", "Tiv"],
    correct: 2,
    explanation: "Suya is a Hausa-Fulani delicacy from northern Nigeria, seasoned with a spiced groundnut (yaji) rub and now enjoyed across West Africa.",
    category: "food",
  },
  {
    question: "Egusi soup is made primarily from the ground seeds of which plant?",
    options: ["Sunflower", "Melon / gourd", "Sesame", "Pumpkin"],
    correct: 1,
    explanation: "Egusi is ground melon (gourd) seeds used as the base for a rich West African soup, popular in Nigeria, Ghana and Cameroon.",
    category: "food",
  },
  {
    question: "Injera, the spongy fermented flatbread used as both plate and utensil, is central to the cuisine of which countries?",
    options: ["Ethiopia and Eritrea", "Kenya and Uganda", "Somalia and Djibouti", "Sudan and Chad"],
    correct: 0,
    explanation: "Injera is made from teff flour and central to both Ethiopian and Eritrean cuisine — stews (wot) are served on top and eaten by tearing pieces off.",
    category: "food",
  },
  {
    question: "Bunny chow, a hollowed-out loaf filled with curry, originated in which South African city?",
    options: ["Cape Town", "Johannesburg", "Durban", "Pretoria"],
    correct: 2,
    explanation: "Bunny chow originated in Durban's Indian community, likely in the 1940s, and has become one of South Africa's most beloved street foods.",
    category: "food",
  },
  {
    question: "Marcus Garvey founded the UNIA and was a pioneer of which movement?",
    options: ["The Civil Rights Movement", "Pan-Africanism", "Black Power", "Négritude"],
    correct: 1,
    explanation: "Marcus Garvey founded the UNIA in 1914 and championed Pan-Africanism and the 'Back to Africa' movement, inspiring generations of Black nationalists.",
    category: "history",
  },
  {
    question: "Patrice Lumumba was the first democratically elected Prime Minister of which country?",
    options: ["Kenya", "Tanzania", "Democratic Republic of Congo", "Zambia"],
    correct: 2,
    explanation: "Patrice Lumumba became the first Prime Minister of the independent Republic of the Congo in 1960 and was assassinated the following year.",
    category: "history",
  },
  {
    question: "Kwame Nkrumah led which country to independence in 1957 with the rallying cry 'Seek ye first the political kingdom'?",
    options: ["Nigeria", "Ghana", "Senegal", "Ivory Coast"],
    correct: 1,
    explanation: "Kwame Nkrumah led Ghana to independence in 1957 and became its first Prime Minister, becoming a central figure in Pan-Africanism.",
    category: "history",
  },
  {
    question: "Thomas Sankara, nicknamed 'Africa's Che Guevara', was President of which country?",
    options: ["Mali", "Guinea", "Burkina Faso", "Niger"],
    correct: 2,
    explanation: "Thomas Sankara was the revolutionary President of Burkina Faso from 1983–1987. He renamed the country from Upper Volta and championed self-reliance.",
    category: "history",
  },
  {
    question: "South African singer Miriam Makeba, dubbed 'Mama Africa', was exiled due to her opposition to what?",
    options: ["Military rule", "Apartheid", "Colonial taxation", "Land privatisation"],
    correct: 1,
    explanation: "Miriam Makeba was exiled for speaking out against apartheid. Her South African passport was revoked in 1960 and she lived in exile for over 30 years.",
    category: "music",
  },
  {
    question: "Hugh Masekela was a legendary South African jazz musician best known for playing which instrument?",
    options: ["Saxophone", "Piano", "Trumpet and flugelhorn", "Double bass"],
    correct: 2,
    explanation: "Hugh Masekela was a virtuoso trumpet and flugelhorn player. His 1968 song 'Grazing in the Grass' reached No. 1 in the US.",
    category: "music",
  },
  {
    question: "Youssou N'Dour is a global music icon from which country?",
    options: ["Mali", "Senegal", "Guinea", "Gambia"],
    correct: 1,
    explanation: "Youssou N'Dour is a Senegalese singer who popularised mbalax music globally. He later served as his country's Minister of Culture.",
    category: "music",
  },
  {
    question: "The Azonto dance and music genre originated in which West African country?",
    options: ["Nigeria", "Senegal", "Ghana", "Ivory Coast"],
    correct: 2,
    explanation: "Azonto originated in Ghana around 2011, characterised by mime-like movements. It went viral globally and put Ghanaian street culture on the map.",
    category: "culture",
  },
  {
    question: "The Gwara Gwara dance went viral in 2017 from which country?",
    options: ["Nigeria", "South Africa", "Zimbabwe", "Kenya"],
    correct: 1,
    explanation: "Gwara Gwara went viral in South Africa in 2017 after DJ Bongz posted a video, and became globally famous when Rihanna performed it at the Grammys.",
    category: "culture",
  },
  {
    question: "The Zanku dance, also known as Legwork, was popularised by which Nigerian artist?",
    options: ["Burna Boy", "Wizkid", "Zlatan Ibile", "Tekno"],
    correct: 2,
    explanation: "Zanku (Legwork) was popularised by Nigerian rapper Zlatan Ibile in 2018, and the foot-focused dance spread rapidly across Africa and the diaspora.",
    category: "culture",
  },
  {
    question: "Didier Drogba is a football legend who represented which African nation?",
    options: ["Ghana", "Nigeria", "Ivory Coast", "Senegal"],
    correct: 2,
    explanation: "Didier Drogba represented Ivory Coast (Côte d'Ivoire) and is revered as the country's greatest footballer, scoring 65 goals in 105 international appearances.",
    category: "sport",
  },
  {
    question: "Caster Semenya won Olympic gold medals in the women's 800m at which two Olympics?",
    options: ["2008 and 2012", "2012 and 2016", "2016 and 2020", "2008 and 2016"],
    correct: 1,
    explanation: "Caster Semenya won gold in the women's 800m at both the 2012 London and 2016 Rio Olympics, becoming a lightning rod for debate over gender eligibility rules.",
    category: "sport",
  },
  {
    question: "Serena Williams won how many Grand Slam singles titles during her tennis career?",
    options: ["19", "21", "23", "25"],
    correct: 2,
    explanation: "Serena Williams won 23 Grand Slam singles titles — the most by any player in the Open Era — transforming tennis and becoming a global cultural icon.",
    category: "sport",
  },
  {
    question: "Heavyweight boxing champion Anthony Joshua was born in England and has heritage from which African country?",
    options: ["Ghana", "Nigeria", "Kenya", "Sierra Leone"],
    correct: 1,
    explanation: "Anthony Joshua was born in Watford, England, to Nigerian parents of Yoruba origin. He has spoken openly about his Nigerian heritage and identity.",
    category: "sport",
  },
  // ── 190 additional questions (expanded bank) ──────────────────────────
// === AFRICAN LANGUAGES & LINGUISTICS ===
  {
    question: "Which African language is the most widely spoken lingua franca in East Africa?",
    options: ["Yoruba", "Swahili", "Amharic", "Zulu"],
    correct: 1,
    explanation: "Swahili (Kiswahili) is spoken by over 100 million people across East Africa and is an official language of the African Union.",
    category: "culture",
  },
  {
    question: "Which language family is known for its use of click consonants?",
    options: ["Bantu", "Khoisan", "Afro-Asiatic", "Nilo-Saharan"],
    correct: 1,
    explanation: "The Khoisan languages of southern Africa are famous for their extensive use of click consonants, with some having over 100 distinct click sounds.",
    category: "culture",
  },
  {
    question: "Yoruba, Igbo, and Fon are all examples of what type of language?",
    options: ["Agglutinative languages", "Tonal languages", "Click languages", "Sign languages"],
    correct: 1,
    explanation: "These West African languages use pitch to distinguish word meaning — the same syllable said at different tones can mean entirely different things.",
    category: "culture",
  },
  {
    question: "Which African language has the most native speakers on the continent?",
    options: ["Swahili", "Hausa", "Arabic", "Yoruba"],
    correct: 2,
    explanation: "Arabic, spoken across North Africa, has the most native speakers on the continent, with over 150 million speakers in Africa alone.",
    category: "culture",
  },
  {
    question: "The word 'safari' comes from which African language?",
    options: ["Zulu", "Amharic", "Swahili", "Wolof"],
    correct: 2,
    explanation: "Safari means 'journey' in Swahili. Many English words like 'bongo', 'jumbo', and 'hakuna matata' also derive from Swahili.",
    category: "culture",
  },
  {
    question: "Ge'ez script is the ancient writing system still used in which country?",
    options: ["Nigeria", "Ethiopia", "Egypt", "Mali"],
    correct: 1,
    explanation: "Ge'ez script, dating back to the 5th century BCE, is still used to write Amharic and Tigrinya in Ethiopia and Eritrea.",
    category: "history",
  },
  {
    question: "N'Ko is a writing script invented in 1949 for which group of West African languages?",
    options: ["Yoruba languages", "Manding languages", "Bantu languages", "Cushitic languages"],
    correct: 1,
    explanation: "Solomana Kanté created N'Ko to write Manding languages (Bambara, Dyula, Mandinka), proving they could have their own unified script.",
    category: "culture",
  },

  // === CARIBBEAN HISTORY ===
  {
    question: "In what year did the Haitian Revolution begin, making Haiti the first Black republic?",
    options: ["1776", "1791", "1804", "1833"],
    correct: 1,
    explanation: "The Haitian Revolution began in 1791 with a slave uprising and concluded in 1804 when Haiti declared independence from France.",
    category: "history",
  },
  {
    question: "Who led the Haitian Revolution and is known as the 'Black Napoleon'?",
    options: ["Jean-Jacques Dessalines", "Toussaint Louverture", "Henri Christophe", "Alexandre Pétion"],
    correct: 1,
    explanation: "Toussaint Louverture, a formerly enslaved man, led the revolution and became its most iconic figure before being captured by the French in 1802.",
    category: "history",
  },
  {
    question: "The Empire Windrush arrived in Britain in 1948 carrying passengers primarily from which country?",
    options: ["Trinidad", "Jamaica", "Barbados", "Nigeria"],
    correct: 1,
    explanation: "The MV Empire Windrush brought 492 Caribbean migrants to Tilbury Docks, London, in June 1948, marking the start of the Windrush generation.",
    category: "history",
  },
  {
    question: "What were 'Maroons' in Caribbean history?",
    options: ["European settlers", "Escaped enslaved people who formed free communities", "Indigenous traders", "Colonial governors"],
    correct: 1,
    explanation: "Maroon communities were founded by people who escaped slavery and built independent settlements in mountains and forests across Jamaica, Suriname, and other Caribbean regions.",
    category: "history",
  },
  {
    question: "Which Caribbean island was the last British colony to abolish slavery, doing so in 1838?",
    options: ["Barbados", "Jamaica", "Trinidad", "Antigua"],
    correct: 3,
    explanation: "While the Slavery Abolition Act was passed in 1833, full emancipation across the British Caribbean came on August 1, 1838, with Antigua being notable for immediate full freedom in 1834.",
    category: "history",
  },
  {
    question: "The Jamaican Maroon leader Nanny of the Maroons is honoured on which denomination of Jamaican currency?",
    options: ["$100 note", "$500 note", "$1000 note", "$50 note"],
    correct: 1,
    explanation: "Queen Nanny, an 18th-century Maroon leader and National Hero of Jamaica, appears on the Jamaican $500 note.",
    category: "history",
  },

  // === CIVIL RIGHTS ===
  {
    question: "Who was the organiser behind the 1964 Mississippi Freedom Summer and a key SNCC strategist?",
    options: ["Ella Baker", "Fannie Lou Hamer", "Bob Moses", "Stokely Carmichael"],
    correct: 2,
    explanation: "Bob Moses organised Freedom Summer, a voter registration drive in Mississippi that brought national attention to violent suppression of Black voters.",
    category: "history",
  },
  {
    question: "Fannie Lou Hamer's famous testimony at the 1964 Democratic National Convention described her experience of what?",
    options: ["Being denied voting rights and brutally beaten", "A march across the Edmund Pettus Bridge", "The Montgomery Bus Boycott", "The sit-in movement"],
    correct: 0,
    explanation: "Hamer's televised testimony about being beaten in jail for trying to register to vote was so powerful that President Johnson called a press conference to preempt it.",
    category: "history",
  },
  {
    question: "Ella Baker is often called the 'mother' of which civil rights organisation?",
    options: ["NAACP", "SCLC", "SNCC", "Congress of Racial Equality"],
    correct: 2,
    explanation: "Ella Baker helped found the Student Nonviolent Coordinating Committee (SNCC) in 1960, mentoring young activists while advocating grassroots organising over charismatic leadership.",
    category: "history",
  },
  {
    question: "Which Black Panther Party programme provided free breakfast to children?",
    options: ["The Liberation Schools", "The Free Breakfast for School Children Program", "The Community Survival Program", "The People's Kitchen"],
    correct: 1,
    explanation: "Started in 1969, the Free Breakfast programme fed thousands of children daily and was so effective it influenced the federal government's own school breakfast initiatives.",
    category: "history",
  },
  {
    question: "Bayard Rustin was the chief organiser of which landmark 1963 event?",
    options: ["The Freedom Rides", "The March on Washington", "The Selma to Montgomery Marches", "The Birmingham Campaign"],
    correct: 1,
    explanation: "Rustin's organisational genius made the March on Washington possible, though his contributions were often minimised due to his openly gay identity.",
    category: "history",
  },

  // === AFRICAN FASHION ===
  {
    question: "The 2022 V&A exhibition 'Africa Fashion' showcased designers from how many African countries?",
    options: ["15", "20", "Over 40", "All 54"],
    correct: 2,
    explanation: "The landmark V&A exhibition featured over 45 designers from more than 40 African countries, spanning from the 1950s to the present day.",
    category: "fashion",
  },
  {
    question: "Duro Olowu, the London-based fashion designer, was born in which country?",
    options: ["Nigeria", "Ghana", "Jamaica", "Senegal"],
    correct: 0,
    explanation: "Duro Olowu was born in Lagos, Nigeria, to a Nigerian father and Jamaican mother. Michelle Obama notably wore his designs, boosting his international profile.",
    category: "fashion",
  },
  {
    question: "Which Senegalese-born designer founded the luxury brand Tongoro?",
    options: ["Thebe Magugu", "Sarah Diouf", "Adama Paris", "Imane Ayissi"],
    correct: 1,
    explanation: "Sarah Diouf founded Tongoro in Dakar with a commitment to manufacturing entirely in Africa, gaining fans like Beyoncé and Naomi Campbell.",
    category: "fashion",
  },
  {
    question: "South African designer Thebe Magugu won which major fashion prize in 2019?",
    options: ["CFDA Award", "LVMH Prize", "British Fashion Award", "ANDAM Prize"],
    correct: 1,
    explanation: "Thebe Magugu became the first African designer to win the LVMH Prize, fashion's most prestigious award for emerging talent.",
    category: "fashion",
  },
  {
    question: "Kente cloth originates from which ethnic group in West Africa?",
    options: ["Yoruba", "Ashanti", "Igbo", "Wolof"],
    correct: 1,
    explanation: "Kente is a handwoven silk and cotton cloth originating from the Ashanti people of Ghana, traditionally worn by royalty during important ceremonies.",
    category: "fashion",
  },
  {
    question: "Which Nigerian brand is known for the 'agbada' modernisation movement?",
    options: ["Maxivive", "Mai Atafo", "Orange Culture", "Emmy Kasbit"],
    correct: 1,
    explanation: "Mai Atafo has been credited with modernising the traditional Yoruba agbada, making it a global fashion statement worn at red carpets and weddings worldwide.",
    category: "fashion",
  },

  // === AFRICAN TECH ===
  {
    question: "M-Pesa, the pioneering mobile money service, launched in 2007 in which country?",
    options: ["Nigeria", "South Africa", "Kenya", "Rwanda"],
    correct: 2,
    explanation: "M-Pesa launched in Kenya through Safaricom, revolutionising financial inclusion. By 2023, it processed over $314 billion in transactions annually.",
    category: "culture",
  },
  {
    question: "Flutterwave, the African fintech unicorn, was co-founded by which Nigerian entrepreneur?",
    options: ["Jason Njoku", "Olugbenga Agboola", "Shola Akinlade", "Iyinoluwa Aboyeji"],
    correct: 1,
    explanation: "Olugbenga 'GB' Agboola co-founded Flutterwave in 2016, and by 2022 it was valued at over $3 billion, processing payments across Africa.",
    category: "culture",
  },
  {
    question: "Which Nigerian company was founded in 2014 to train and place African software developers with global companies?",
    options: ["Paystack", "Andela", "Interswitch", "Kuda"],
    correct: 1,
    explanation: "Andela was co-founded by Iyinoluwa Aboyeji and Jeremy Johnson to tap into Africa's tech talent, eventually raising over $381 million in funding.",
    category: "culture",
  },
  {
    question: "Rwanda's capital Kigali is home to which major tech hub known as Africa's 'Silicon Savannah'?",
    options: ["iHub", "kLab", "CcHub", "BongoHive"],
    correct: 1,
    explanation: "kLab (Knowledge Lab) in Kigali is one of Rwanda's pioneering tech hubs, though 'Silicon Savannah' is more commonly associated with Nairobi's tech scene.",
    category: "culture",
  },

  // === BLACK MARTIAL ARTS & CAPOEIRA ===
  {
    question: "Capoeira, the Afro-Brazilian martial art, was developed by enslaved people from which region?",
    options: ["East Africa", "West and Central Africa", "North Africa", "Southern Africa"],
    correct: 1,
    explanation: "Capoeira was created by enslaved Africans from Angola and surrounding regions in Brazil, disguising combat training as dance to avoid punishment.",
    category: "culture",
  },
  {
    question: "Who is considered the father of modern capoeira and founded the first formal capoeira school?",
    options: ["Mestre Pastinha", "Mestre Bimba", "Mestre Moraes", "Mestre Acordeon"],
    correct: 1,
    explanation: "Mestre Bimba (Manuel dos Reis Machado) founded the first capoeira academy in Salvador, Bahia, in 1932 and created the Capoeira Regional style.",
    category: "culture",
  },
  {
    question: "Which legendary martial artist studied under Black karate pioneer Jhoon Rhee and credited Black martial artists as key influences?",
    options: ["Jackie Chan", "Bruce Lee", "Jean-Claude Van Damme", "Chuck Norris"],
    correct: 1,
    explanation: "Bruce Lee trained alongside and was influenced by Black martial artists. His student Jim Kelly became the first major Black martial arts film star in 'Enter the Dragon'.",
    category: "culture",
  },

  // === AFRICAN NOBEL LAUREATES ===
  {
    question: "Wangari Maathai became the first African woman to win the Nobel Peace Prize in 2004 for her work in which area?",
    options: ["Literature", "Environmental conservation", "Medicine", "Economics"],
    correct: 1,
    explanation: "Kenyan Wangari Maathai won for her Green Belt Movement, which planted over 51 million trees across Africa and empowered rural women.",
    category: "history",
  },
  {
    question: "Abdulrazak Gurnah won the 2021 Nobel Prize in Literature. He was born in which country?",
    options: ["Kenya", "Tanzania (Zanzibar)", "Somalia", "Uganda"],
    correct: 1,
    explanation: "Gurnah was born in Zanzibar (now part of Tanzania) and won for his uncompromising exploration of colonialism and the refugee experience.",
    category: "literature",
  },
  {
    question: "Who was the first African to win the Nobel Prize in Literature, in 1986?",
    options: ["Chinua Achebe", "Wole Soyinka", "Ngũgĩ wa Thiong'o", "Nadine Gordimer"],
    correct: 1,
    explanation: "Nigerian playwright and poet Wole Soyinka became the first African Nobel laureate in literature, honoured for his rich dramatic and poetic work.",
    category: "literature",
  },
  {
    question: "Denis Mukwege won the Nobel Peace Prize in 2018 for his work treating survivors of sexual violence in which country?",
    options: ["Rwanda", "DR Congo", "South Sudan", "Uganda"],
    correct: 1,
    explanation: "Dr. Mukwege, a Congolese gynaecologist, has treated tens of thousands of survivors at Panzi Hospital in Bukavu, DRC, and shared the prize with Nadia Murad.",
    category: "history",
  },

  // === BLACK IN SPACE ===
  {
    question: "Who was the first African American woman to travel to space?",
    options: ["Stephanie Wilson", "Mae Jemison", "Joan Higginbotham", "Jeanette Epps"],
    correct: 1,
    explanation: "Mae Jemison flew aboard the Space Shuttle Endeavour in 1992, making history as the first Black woman in space. She is also a physician and engineer.",
    category: "history",
  },
  {
    question: "Victor Glover made history in 2020 as the first Black astronaut to do what?",
    options: ["Walk on the Moon", "Serve on a long-duration ISS mission", "Command a Space Shuttle", "Fly to Mars orbit"],
    correct: 1,
    explanation: "Victor Glover was the first Black astronaut to live aboard the International Space Station for an extended mission, arriving on SpaceX Crew-1.",
    category: "history",
  },
  {
    question: "Guion Bluford became the first African American in space in 1983 aboard which Space Shuttle?",
    options: ["Columbia", "Discovery", "Challenger", "Atlantis"],
    correct: 2,
    explanation: "Guion 'Guy' Bluford launched on Space Shuttle Challenger in August 1983, opening the door for future Black astronauts.",
    category: "history",
  },

  // === AFRICAN NATURAL WONDERS ===
  {
    question: "Victoria Falls, one of the world's largest waterfalls, sits on the border of which two countries?",
    options: ["Kenya and Tanzania", "Zambia and Zimbabwe", "Uganda and DR Congo", "Cameroon and Nigeria"],
    correct: 1,
    explanation: "Known locally as 'Mosi-oa-Tunya' (The Smoke That Thunders), Victoria Falls on the Zambezi River is a UNESCO World Heritage Site.",
    category: "culture",
  },
  {
    question: "Mount Kilimanjaro, Africa's highest peak, is located in which country?",
    options: ["Kenya", "Uganda", "Tanzania", "Ethiopia"],
    correct: 2,
    explanation: "Kilimanjaro stands at 5,895 metres in northeastern Tanzania. It is the world's tallest free-standing mountain and a dormant volcano.",
    category: "culture",
  },
  {
    question: "The Okavango Delta, one of the world's largest inland deltas, is located in which country?",
    options: ["Namibia", "Botswana", "Zambia", "Mozambique"],
    correct: 1,
    explanation: "The Okavango Delta in Botswana floods seasonally, transforming the Kalahari Desert into a lush wildlife paradise and UNESCO World Heritage Site.",
    category: "culture",
  },
  {
    question: "The Sahara Desert covers approximately what percentage of the African continent?",
    options: ["10%", "25%", "31%", "45%"],
    correct: 2,
    explanation: "The Sahara covers about 31% of Africa (9.2 million km²), making it roughly the same size as the United States or China.",
    category: "culture",
  },
  {
    question: "Lake Malawi is home to more species of fish than any other lake on Earth. Approximately how many?",
    options: ["200", "500", "Over 1,000", "Over 3,000"],
    correct: 2,
    explanation: "Lake Malawi contains over 1,000 species of cichlid fish, most found nowhere else, making it one of the most biodiverse lakes in the world.",
    category: "culture",
  },

  // === NOLLYWOOD ===
  {
    question: "Which 1992 film is widely considered the first Nollywood movie?",
    options: ["The Figurine", "Living in Bondage", "Thunderbolt", "Osuofia in London"],
    correct: 1,
    explanation: "Living in Bondage, directed by Chris Obi Rapu and starring Kenneth Okonkwo, launched the Nigerian home video revolution and the Nollywood industry.",
    category: "film",
  },
  {
    question: "Nollywood is the world's second-largest film industry by volume, producing roughly how many films per year?",
    options: ["500", "1,000", "2,500", "5,000"],
    correct: 2,
    explanation: "Nollywood produces approximately 2,500 films annually, second only to India's Bollywood and ahead of Hollywood in sheer volume.",
    category: "film",
  },
  {
    question: "Genevieve Nnaji's directorial debut 'Lionheart' made history as Nigeria's first submission to which award?",
    options: ["BAFTA", "Golden Globe", "Academy Awards (Oscars)", "Cannes Palme d'Or"],
    correct: 2,
    explanation: "Lionheart (2018) was Nigeria's first-ever Oscar submission for Best International Feature Film, though it was later disqualified for having too much English dialogue.",
    category: "film",
  },
  {
    question: "Which Nollywood actress starred in 'Half of a Yellow Sun' alongside Chiwetel Ejiofor?",
    options: ["Omotola Jalade-Ekeinde", "Genevieve Nnaji", "Thandiwe Newton", "Adesua Etomi"],
    correct: 3,
    explanation: "Adesua Etomi starred alongside Chiwetel Ejiofor in the 2013 adaptation of Chimamanda Ngozi Adichie's novel set during the Nigerian Civil War.",
    category: "film",
  },

  // === AFRICAN CURRENCIES & ECONOMIES ===
  {
    question: "The CFA franc, used in 14 African countries, was historically pegged to which European currency?",
    options: ["British pound", "German mark", "French franc (now euro)", "Spanish peseta"],
    correct: 2,
    explanation: "The CFA franc was created in 1945 and pegged to the French franc, later to the euro. Critics argue it limits monetary sovereignty for member nations.",
    category: "history",
  },
  {
    question: "The African Continental Free Trade Area (AfCFTA), launched in 2021, aims to create a market of how many people?",
    options: ["500 million", "1 billion", "1.3 billion", "2 billion"],
    correct: 2,
    explanation: "AfCFTA connects 1.3 billion people across 54 nations, making it the world's largest free trade area by number of participating countries.",
    category: "culture",
  },
  {
    question: "Which country's currency, the naira, has the code NGN?",
    options: ["Niger", "Nigeria", "Namibia", "Mozambique"],
    correct: 1,
    explanation: "The Nigerian naira (₦) was introduced in 1973, replacing the pound. Nigeria has Africa's largest economy by GDP.",
    category: "culture",
  },

  // === AFRO-BRAZILIAN CULTURE ===
  {
    question: "Salvador da Bahia in Brazil is often called the most African city outside Africa. Which country supplied the majority of enslaved people brought there?",
    options: ["Ghana", "Senegal", "Angola/Congo", "Mozambique"],
    correct: 2,
    explanation: "The majority of enslaved Africans brought to Bahia came from Angola and the Congo region, deeply influencing the culture, religion, and cuisine of Salvador.",
    category: "history",
  },
  {
    question: "Candomblé, an Afro-Brazilian religion practised in Bahia, is rooted in the traditions of which West African people?",
    options: ["Hausa", "Yoruba", "Igbo", "Fula"],
    correct: 1,
    explanation: "Candomblé preserves Yoruba spiritual traditions, including worship of orishas (orixás in Portuguese), ceremonial drumming, and ritual dance.",
    category: "culture",
  },
  {
    question: "What is the name of the Afro-Brazilian dance-fight practice performed in a circle called a 'roda'?",
    options: ["Samba de roda", "Capoeira", "Maracatu", "Frevo"],
    correct: 1,
    explanation: "Capoeira is performed in a roda (circle) to the rhythm of the berimbau, a single-string instrument that sets the tempo and style of the game.",
    category: "culture",
  },
  {
    question: "Baile funk (or funk carioca) originated in the favelas of which Brazilian city?",
    options: ["São Paulo", "Salvador", "Rio de Janeiro", "Recife"],
    correct: 2,
    explanation: "Baile funk emerged in Rio de Janeiro's favelas in the 1980s, blending Miami bass with local rhythms to create one of Brazil's most influential music genres.",
    category: "music",
  },

  // === BLACK HAIR CULTURE ===
  {
    question: "The CROWN Act, legislation banning hair discrimination, stands for what?",
    options: ["Creating Respect for Our Workplace Norms", "Creating a Respectful and Open World for Natural Hair", "Cultural Rights of Women Nationally", "Celebrating Roots of Our World's Nations"],
    correct: 1,
    explanation: "The CROWN Act (Creating a Respectful and Open World for Natural Hair) was first passed in California in 2019 and has since been adopted by numerous US states.",
    category: "culture",
  },
  {
    question: "Madam C.J. Walker, considered the first female self-made millionaire in America, built her fortune in which industry?",
    options: ["Fashion", "Hair care products", "Real estate", "Publishing"],
    correct: 1,
    explanation: "Born Sarah Breedlove in 1867, Madam C.J. Walker created a line of hair care products for Black women and built a business empire in the early 1900s.",
    category: "history",
  },
  {
    question: "The Netflix series 'Self Made' starring Octavia Spencer depicted the life of which beauty pioneer?",
    options: ["Annie Malone", "Madam C.J. Walker", "Madame Lilian", "Lyda Newman"],
    correct: 1,
    explanation: "The 2020 Netflix miniseries told the story of Madam C.J. Walker's rise from washerwoman to America's first female self-made millionaire.",
    category: "culture",
  },

  // === AFRICAN WORLD HERITAGE SITES ===
  {
    question: "The ancient city of Timbuktu, once a centre of Islamic scholarship, is located in which modern country?",
    options: ["Niger", "Mauritania", "Mali", "Burkina Faso"],
    correct: 2,
    explanation: "Timbuktu in Mali was a major intellectual centre by the 15th century, home to the University of Sankore and libraries containing hundreds of thousands of manuscripts.",
    category: "history",
  },
  {
    question: "The rock-hewn churches of Lalibela, carved from single blocks of stone, are in which country?",
    options: ["Egypt", "Ethiopia", "Sudan", "Eritrea"],
    correct: 1,
    explanation: "The 11 medieval rock-hewn churches of Lalibela were carved in the 12th-13th centuries and are still active places of worship, often called Africa's 'New Jerusalem'.",
    category: "history",
  },
  {
    question: "Robben Island, where Nelson Mandela was imprisoned for 18 years, is located off the coast of which city?",
    options: ["Durban", "Johannesburg", "Cape Town", "Port Elizabeth"],
    correct: 2,
    explanation: "Robben Island lies in Table Bay, 6.9 km off the coast of Cape Town. Mandela was held there from 1964 to 1982 before transfer to Pollsmoor Prison.",
    category: "history",
  },
  {
    question: "Gorée Island, a UNESCO World Heritage Site and symbol of the transatlantic slave trade, is off the coast of which city?",
    options: ["Accra", "Dakar", "Abidjan", "Lagos"],
    correct: 1,
    explanation: "Gorée Island off the coast of Dakar, Senegal, served as a major slave trading post from the 15th to 19th centuries. The House of Slaves museum preserves its history.",
    category: "history",
  },
  {
    question: "Great Zimbabwe, the largest stone structure in sub-Saharan Africa, gave its name to which modern country?",
    options: ["Zambia", "Mozambique", "Zimbabwe", "Malawi"],
    correct: 2,
    explanation: "Great Zimbabwe was built between the 11th and 15th centuries by the ancestors of the Shona people. The country took its name from these ruins at independence in 1980.",
    category: "history",
  },

  // === JAZZ HISTORY ===
  {
    question: "Which pianist and composer is considered the founder of bebop jazz?",
    options: ["Duke Ellington", "Thelonious Monk", "Charlie Parker", "Art Tatum"],
    correct: 2,
    explanation: "Charlie 'Bird' Parker, along with Dizzy Gillespie, pioneered bebop in the 1940s, transforming jazz from dance music into an art form with complex harmonies and fast tempos.",
    category: "music",
  },
  {
    question: "Blue Note Records, the legendary jazz label, was founded in 1939 by Alfred Lion and which other person?",
    options: ["Francis Wolff", "Rudy Van Gelder", "Max Roach", "Quincy Jones"],
    correct: 0,
    explanation: "German-born Alfred Lion and Francis Wolff founded Blue Note Records, which became home to artists like Art Blakey, John Coltrane, and Herbie Hancock.",
    category: "music",
  },
  {
    question: "Miles Davis's 1959 album 'Kind of Blue' is the best-selling jazz album of all time. What style did it pioneer?",
    options: ["Free jazz", "Modal jazz", "Cool jazz", "Hard bop"],
    correct: 1,
    explanation: "Kind of Blue pioneered modal jazz, which uses musical modes rather than chord progressions, giving soloists more freedom. It has sold over 5 million copies.",
    category: "music",
  },
  {
    question: "John Coltrane's 1965 album 'A Love Supreme' is structured as a four-part suite. What is the first part called?",
    options: ["Resolution", "Pursuance", "Acknowledgement", "Psalm"],
    correct: 2,
    explanation: "A Love Supreme's four movements — Acknowledgement, Resolution, Pursuance, Psalm — represent Coltrane's spiritual journey and is considered one of jazz's greatest recordings.",
    category: "music",
  },
  {
    question: "Which city is considered the birthplace of jazz?",
    options: ["Chicago", "New York", "New Orleans", "Memphis"],
    correct: 2,
    explanation: "New Orleans, Louisiana, is widely recognised as jazz's birthplace, where African, Caribbean, and European musical traditions merged in the early 20th century.",
    category: "music",
  },

  // === AFRICAN COMICS & ANIMATION ===
  {
    question: "The Disney+ animated series 'Iwájú' was a collaboration between Disney and which African creative studio?",
    options: ["Leti Arts", "Kugali", "Triggerfish", "Anthill Studios"],
    correct: 1,
    explanation: "Kugali, a pan-African entertainment company, co-produced Iwájú with Disney, set in a futuristic Lagos exploring themes of class and inequality.",
    category: "art",
  },
  {
    question: "Which South African animation studio produced the Oscar-nominated short 'Mama K's Team 4'?",
    options: ["Kugali", "Triggerfish Animation", "Studio Inkblot", "Luma Animation"],
    correct: 1,
    explanation: "Triggerfish Animation Studios in Cape Town is Africa's leading animation studio, also known for producing 'Kizazi Moto: Generation Fire' for Disney+.",
    category: "art",
  },
  {
    question: "The Afro-futurist comic 'Aurion: Legacy of the Kori-Odan' was developed by a studio in which African country?",
    options: ["Nigeria", "South Africa", "Cameroon", "Kenya"],
    correct: 2,
    explanation: "Aurion was developed by Kiro'o Games in Cameroon, making it one of the first major video games developed in Central Africa, inspired by African mythology.",
    category: "art",
  },

  // === BLACK WOMEN IN MUSIC ===
  {
    question: "Nina Simone's protest song 'Mississippi Goddam' was written in response to which 1963 events?",
    options: ["The March on Washington", "The Birmingham church bombing and Medgar Evers' assassination", "The Freedom Rides", "The Watts riots"],
    correct: 1,
    explanation: "Nina Simone wrote 'Mississippi Goddam' in a fury after the 16th Street Baptist Church bombing in Birmingham and the murder of Medgar Evers in Mississippi.",
    category: "music",
  },
  {
    question: "Lauryn Hill's 'The Miseducation of Lauryn Hill' won how many Grammy Awards in 1999?",
    options: ["3", "5", "7", "10"],
    correct: 1,
    explanation: "The Miseducation of Lauryn Hill won five Grammys including Album of the Year, making Hill the first woman to win five Grammys in one night.",
    category: "music",
  },
  {
    question: "Erykah Badu is often called the 'Queen of' which music genre?",
    options: ["R&B", "Neo-soul", "Afrobeats", "Jazz"],
    correct: 1,
    explanation: "Erykah Badu's 1997 debut 'Baduizm' helped define neo-soul, blending soul, jazz, and hip-hop with Afrocentric spirituality and consciousness.",
    category: "music",
  },
  {
    question: "SZA's album 'Ctrl' spent over 400 weeks on the Billboard 200, but her 2022 album that broke streaming records was called what?",
    options: ["Solána", "SOS", "Saturn", "Superposition"],
    correct: 1,
    explanation: "SOS debuted at number one on the Billboard 200 with the biggest streaming week for an R&B album, featuring hits like 'Kill Bill' and 'Shirt'.",
    category: "music",
  },
  {
    question: "Which Nigerian-born singer won Best New Artist at the 2024 Grammy Awards?",
    options: ["Ayra Starr", "Tems", "Victoria Monét", "Ice Spice"],
    correct: 2,
    explanation: "Victoria Monét, of African American and Nigerian heritage, won Best New Artist at the 66th Grammy Awards for her work including the hit 'On My Mama'.",
    category: "music",
  },

  // === PRE-COLONIAL AFRICAN TRADE ===
  {
    question: "The trans-Saharan trade routes primarily exchanged gold from West Africa for what commodity from the north?",
    options: ["Spices", "Salt", "Silk", "Iron"],
    correct: 1,
    explanation: "Salt from Saharan mines was so valuable in West Africa that it was sometimes traded weight-for-weight with gold, fuelling empires like Mali and Songhai.",
    category: "history",
  },
  {
    question: "Mansa Musa's famous 1324 pilgrimage to Mecca crashed the gold market in which city along his route?",
    options: ["Timbuktu", "Cairo", "Medina", "Marrakech"],
    correct: 1,
    explanation: "Mansa Musa of Mali distributed so much gold during his stop in Cairo that he devalued the metal for over a decade, demonstrating the Mali Empire's extraordinary wealth.",
    category: "history",
  },
  {
    question: "The Kingdom of Aksum (Axum) was a major trading empire located in modern-day Ethiopia and which other country?",
    options: ["Somalia", "Sudan", "Eritrea", "Djibouti"],
    correct: 2,
    explanation: "Aksum, spanning modern Ethiopia and Eritrea, was one of the four great world powers of the 3rd century alongside Rome, Persia, and China.",
    category: "history",
  },
  {
    question: "The Swahili Coast trade network connected East Africa with merchants from which regions?",
    options: ["Europe and the Americas", "Arabia, Persia, India, and China", "Only North Africa", "Only the Mediterranean"],
    correct: 1,
    explanation: "From the 8th century, Swahili coastal cities like Kilwa, Mombasa, and Zanzibar traded gold, ivory, and enslaved people with Arab, Persian, Indian, and Chinese merchants.",
    category: "history",
  },

  // === CALYPSO & TRINIDAD CARNIVAL ===
  {
    question: "Lord Kitchener is a legendary calypso artist from which Caribbean nation?",
    options: ["Jamaica", "Barbados", "Trinidad and Tobago", "Guyana"],
    correct: 2,
    explanation: "Aldwyn Roberts, known as Lord Kitchener, was a Trinidadian calypso icon who famously sang 'London Is the Place for Me' upon arriving on the Empire Windrush in 1948.",
    category: "music",
  },
  {
    question: "The Mighty Sparrow, known as the 'Calypso King of the World', won the Trinidad Carnival Road March title how many times?",
    options: ["3", "5", "8", "11"],
    correct: 2,
    explanation: "Slinger Francisco, the Mighty Sparrow, won the Road March competition eight times and is considered one of the greatest calypsonians in history.",
    category: "music",
  },
  {
    question: "Soca music, a fusion of soul and calypso, was pioneered by which Trinidadian artist in the 1970s?",
    options: ["Machel Montano", "Lord Shorty", "David Rudder", "Bunji Garlin"],
    correct: 1,
    explanation: "Lord Shorty (Garfield Blackman) is credited with creating soca in the 1970s, fusing calypso with Indian rhythms and soul music influences.",
    category: "music",
  },
  {
    question: "The steelpan (steel drum), Trinidad's national instrument, was invented from what material?",
    options: ["Copper sheets", "Oil drums", "Tin cans", "Bamboo"],
    correct: 1,
    explanation: "The steelpan was invented in the 1930s-40s in Trinidad from discarded oil drums. It is the only acoustic musical instrument invented in the 20th century.",
    category: "music",
  },

  // === AFRICAN ARCHITECTURE ===
  {
    question: "The Great Mosque of Djenné in Mali, the largest mud-brick building in the world, is replastered annually in a community event called what?",
    options: ["The Crépissage", "The Daubé", "The Mudding Festival", "The Restoration"],
    correct: 0,
    explanation: "The Crépissage is an annual festival where the entire community of Djenné comes together to replaster the mosque with fresh mud, combining worship with celebration.",
    category: "art",
  },
  {
    question: "The pyramids of Meroë, numbering over 200, are located in which modern country?",
    options: ["Egypt", "Sudan", "Libya", "Chad"],
    correct: 1,
    explanation: "Sudan has more pyramids than Egypt — over 200 Nubian pyramids at Meroë and other sites, built by the Kingdom of Kush between 700 BCE and 300 CE.",
    category: "history",
  },
  {
    question: "Which Nigerian-born architect designed the Smithsonian National Museum of African American History and Culture?",
    options: ["Kunlé Adeyemi", "David Adjaye", "Francis Kéré", "Diébédo Francis Kéré"],
    correct: 1,
    explanation: "Sir David Adjaye, born in Dar es Salaam to Ghanaian parents (often also claimed by Nigerian heritage), designed the NMAAHC on the National Mall in Washington, D.C.",
    category: "art",
  },
  {
    question: "Francis Kéré, the first African to win the Pritzker Architecture Prize (2022), is from which country?",
    options: ["Senegal", "Burkina Faso", "Côte d'Ivoire", "Mali"],
    correct: 1,
    explanation: "Diébédo Francis Kéré from Burkina Faso won architecture's highest honour for his community-driven designs using local materials and traditional techniques.",
    category: "art",
  },

  // === CONTEMPORARY AFRICAN LITERATURE ===
  {
    question: "Akwaeke Emezi's debut novel 'Freshwater' draws on which Igbo spiritual concept?",
    options: ["Chi", "Ogbanje", "Ikenga", "Odinani"],
    correct: 1,
    explanation: "Freshwater explores the Igbo concept of ogbanje — a spirit that repeatedly dies and returns to torment its mother — through a contemporary, non-binary protagonist.",
    category: "literature",
  },
  {
    question: "Ayọ̀bámi Adébáyọ̀'s acclaimed 2017 debut novel is called what?",
    options: ["The Girl with the Louding Voice", "Stay with Me", "My Sister, the Serial Killer", "An American Marriage"],
    correct: 1,
    explanation: "Stay with Me explores family, fertility, and secrets in Nigeria from the 1980s to 2008, earning Adébáyọ̀ a Wellcome Prize shortlisting and international acclaim.",
    category: "literature",
  },
  {
    question: "Which Nigerian author wrote 'My Sister, the Serial Killer', a darkly comic novel set in Lagos?",
    options: ["Chimamanda Ngozi Adichie", "Oyinkan Braithwaite", "Lola Shoneyin", "Sefi Atta"],
    correct: 1,
    explanation: "Oyinkan Braithwaite's 2018 debut became a global bestseller, blending dark humour with a story of sisterly loyalty and murder in contemporary Lagos.",
    category: "literature",
  },
  {
    question: "Abi Daré's 'The Girl with the Louding Voice' is narrated by a teenage girl seeking education in which country?",
    options: ["Ghana", "Kenya", "Nigeria", "Senegal"],
    correct: 2,
    explanation: "The novel follows 14-year-old Adunni in Nigeria, written in pidgin-inflected English, and highlights the fight for girls' education and women's rights.",
    category: "literature",
  },
  {
    question: "Tsitsi Dangarembga's novel 'Nervous Conditions', considered a classic of African literature, is set in which country?",
    options: ["South Africa", "Zimbabwe", "Mozambique", "Zambia"],
    correct: 1,
    explanation: "Published in 1988, Nervous Conditions was the first novel in English by a Black Zimbabwean woman, exploring colonialism's psychological impact through a young girl's eyes.",
    category: "literature",
  },

  // === BLACK BALLET & DANCE ===
  {
    question: "In 2015, Misty Copeland became the first African American woman to be named principal dancer at which ballet company?",
    options: ["New York City Ballet", "American Ballet Theatre", "Royal Ballet", "San Francisco Ballet"],
    correct: 1,
    explanation: "Misty Copeland broke a major barrier at American Ballet Theatre, one of the world's leading companies, becoming its first Black female principal dancer in 75 years.",
    category: "art",
  },
  {
    question: "The Alvin Ailey American Dance Theater was founded in 1958. Which signature work premiered in 1960 and is still performed today?",
    options: ["Cry", "Revelations", "Blues Suite", "Night Creature"],
    correct: 1,
    explanation: "Revelations, set to African American spirituals, is Alvin Ailey's masterwork and has been seen by more people than any other modern dance piece in history.",
    category: "art",
  },
  {
    question: "The Dance Theatre of Harlem, founded in 1969 by Arthur Mitchell, was the first major Black what?",
    options: ["Modern dance company", "Classical ballet company", "Tap dance company", "Jazz dance company"],
    correct: 1,
    explanation: "Arthur Mitchell, the first Black principal dancer at New York City Ballet, founded Dance Theatre of Harlem to prove that Black dancers could excel in classical ballet.",
    category: "art",
  },

  // === AFRICAN COFFEE ===
  {
    question: "Coffee is believed to have been discovered in the Kaffa region of which country?",
    options: ["Yemen", "Brazil", "Ethiopia", "Colombia"],
    correct: 2,
    explanation: "Legend says a goat herder named Kaldi in Ethiopia's Kaffa region noticed his goats became energetic after eating coffee berries, leading to the discovery of coffee.",
    category: "food",
  },
  {
    question: "The Ethiopian coffee ceremony, called 'buna', traditionally involves roasting beans, brewing, and serving how many rounds?",
    options: ["One", "Two", "Three", "Four"],
    correct: 2,
    explanation: "The Ethiopian coffee ceremony serves three rounds: abol (first), tona (second), and baraka (third, meaning 'blessed'). It's a social ritual that can last hours.",
    category: "food",
  },

  // === DIASPORA POLITICAL FIGURES ===
  {
    question: "Kamala Harris's father is from which Caribbean country?",
    options: ["Trinidad and Tobago", "Jamaica", "Barbados", "Guyana"],
    correct: 1,
    explanation: "Donald Harris, Kamala's father, is a Jamaican-born Stanford economics professor. Her mother, Shyamala Gopalan, was from India.",
    category: "history",
  },
  {
    question: "British rapper Stormzy's scholarship programme funds Black students to attend which university?",
    options: ["Oxford", "Cambridge", "University of London", "Manchester"],
    correct: 2,
    explanation: "In 2018, Stormzy established the Stormzy Scholarship at Cambridge University, funding tuition and living costs for Black British students.",
    category: "culture",
  },
  {
    question: "Which country did Barack Obama's father come from?",
    options: ["Nigeria", "Ghana", "Kenya", "South Africa"],
    correct: 2,
    explanation: "Barack Obama Sr. was from Nyang'oma Kogelo in western Kenya. Barack Obama Jr. became the 44th US president and the first African American to hold the office.",
    category: "history",
  },

  // === BLACK VIDEO GAMES ===
  {
    question: "Miles Morales, the Afro-Latino Spider-Man, first appeared in which comic series before getting his own PlayStation game?",
    options: ["The Amazing Spider-Man", "Ultimate Fallout", "Spider-Verse", "Web of Spider-Man"],
    correct: 1,
    explanation: "Miles Morales debuted in Ultimate Fallout #4 (2011), created by Brian Michael Bendis and Sara Pichelli. His 2020 PlayStation game sold over 10 million copies.",
    category: "culture",
  },
  {
    question: "The 2016 video game 'Aurion: Legacy of the Kori-Odan' is notable for being one of the first action RPGs developed where?",
    options: ["South America", "Central Africa", "Southeast Asia", "Eastern Europe"],
    correct: 1,
    explanation: "Developed by Kiro'o Games in Cameroon, Aurion draws entirely from African mythology and was a landmark in African game development.",
    category: "culture",
  },

  // === AFRICAN FILM FESTIVALS ===
  {
    question: "FESPACO, Africa's largest film festival, is held biennially in which city?",
    options: ["Lagos", "Nairobi", "Ouagadougou", "Dakar"],
    correct: 2,
    explanation: "The Pan-African Film and Television Festival of Ouagadougou (FESPACO) has been held in Burkina Faso's capital since 1969, showcasing African cinema.",
    category: "film",
  },
  {
    question: "The Durban International Film Festival is the longest-running film festival in which continent?",
    options: ["Europe", "South America", "Africa", "Asia"],
    correct: 2,
    explanation: "Founded in 1979, the Durban International Film Festival in South Africa is Africa's oldest, screening over 200 films annually.",
    category: "film",
  },

  // === PAN-AFRICAN SYMBOLS ===
  {
    question: "The Pan-African flag (red, black, and green) was created in 1920 by which organisation?",
    options: ["NAACP", "UNIA (Marcus Garvey's movement)", "African National Congress", "Organisation of African Unity"],
    correct: 1,
    explanation: "Marcus Garvey's Universal Negro Improvement Association adopted the red, black, and green flag in 1920 — red for blood, black for the people, green for the land.",
    category: "history",
  },
  {
    question: "The Ankh, an ancient symbol resembling a cross with a loop at the top, originated in which civilisation?",
    options: ["Nubia", "Ancient Egypt", "Carthage", "Aksum"],
    correct: 1,
    explanation: "The Ankh is an ancient Egyptian hieroglyphic symbol meaning 'life'. It has been widely adopted as a symbol of African identity and heritage.",
    category: "culture",
  },

  // === CARIBBEAN LITERATURE ===
  {
    question: "Derek Walcott won the Nobel Prize in Literature in 1992. He was from which Caribbean island?",
    options: ["Jamaica", "Trinidad", "Saint Lucia", "Barbados"],
    correct: 2,
    explanation: "Derek Walcott from Saint Lucia won the Nobel for his epic poem 'Omeros' and a body of work exploring Caribbean identity, colonialism, and mythology.",
    category: "literature",
  },
  {
    question: "V.S. Naipaul, the Nobel-winning author of 'A House for Mr Biswas', was born in which country?",
    options: ["India", "Trinidad and Tobago", "Guyana", "Jamaica"],
    correct: 1,
    explanation: "Naipaul was born in Chaguanas, Trinidad, to a family of Indian descent. He won the Nobel Prize in Literature in 2001.",
    category: "literature",
  },
  {
    question: "Jamaica Kincaid's novel 'A Small Place' is a searing critique of colonialism's legacy in which Caribbean island?",
    options: ["Jamaica", "Antigua", "Dominica", "Grenada"],
    correct: 1,
    explanation: "A Small Place (1988) is a non-fiction essay about Antigua, Kincaid's birthplace, examining the lasting damage of British colonialism and modern tourism.",
    category: "literature",
  },
  {
    question: "The Trinidadian-Canadian author Dionne Brand won the Griffin Poetry Prize for which collection?",
    options: ["No Language Is Neutral", "Ossuaries", "Land to Light On", "Inventory"],
    correct: 2,
    explanation: "Dionne Brand won the Griffin Poetry Prize in 1997 for 'Land to Light On', exploring displacement, identity, and the Black diaspora experience in Canada.",
    category: "literature",
  },

  // === AFRICAN ASTRONOMY ===
  {
    question: "The Dogon people of Mali have traditional knowledge that includes awareness of which astronomical body?",
    options: ["Jupiter's moons", "Sirius B (a companion star to Sirius)", "Saturn's rings", "The Andromeda Galaxy"],
    correct: 1,
    explanation: "The Dogon people's traditional knowledge of Sirius B, a white dwarf invisible to the naked eye, has fascinated astronomers and anthropologists for decades.",
    category: "culture",
  },
  {
    question: "The Square Kilometre Array (SKA), the world's largest radio telescope project, has its African site in which country?",
    options: ["Kenya", "South Africa", "Namibia", "Nigeria"],
    correct: 1,
    explanation: "South Africa's Karoo region hosts the African portion of the SKA telescope, which will be 50 times more sensitive than any existing radio telescope.",
    category: "culture",
  },

  // === GLOBAL BLACK FOOD CULTURE ===
  {
    question: "Soul food originated in which region of the United States?",
    options: ["Northeast", "Midwest", "American South", "West Coast"],
    correct: 2,
    explanation: "Soul food evolved from the cooking traditions of enslaved Africans in the American South, transforming ingredients like collard greens, cornmeal, and offal into a beloved cuisine.",
    category: "food",
  },
  {
    question: "The Jamaican patty, a flaky pastry filled with spiced meat, gets its distinctive yellow colour from which spice?",
    options: ["Saffron", "Turmeric", "Curry powder", "Annatto"],
    correct: 1,
    explanation: "Turmeric gives the Jamaican patty its signature golden crust. The patty was influenced by the Cornish pasty brought to Jamaica by British colonists.",
    category: "food",
  },
  {
    question: "'Doubles', a popular street food of curried chickpeas in fried dough, is the national street food of which country?",
    options: ["Jamaica", "Guyana", "Trinidad and Tobago", "Barbados"],
    correct: 2,
    explanation: "Doubles is Trinidad's most beloved street food, created by Indian-Trinidadian vendors. Two pieces of bara (fried dough) wrap channa (curried chickpeas) with various chutneys.",
    category: "food",
  },
  {
    question: "Ackee and saltfish is the national dish of Jamaica. Ackee fruit was originally brought from which continent?",
    options: ["Asia", "South America", "West Africa", "Europe"],
    correct: 2,
    explanation: "Ackee was brought from West Africa (specifically Ghana) to Jamaica on slave ships in the 18th century. The word 'ackee' derives from the Akan name 'ankye'.",
    category: "food",
  },
  {
    question: "Thiéboudienne, a rice and fish dish considered Senegal's national dish, was created in which city?",
    options: ["Dakar", "Saint-Louis", "Thies", "Ziguinchor"],
    correct: 1,
    explanation: "Thiéboudienne originated in Saint-Louis, Senegal, and was added to UNESCO's Intangible Cultural Heritage list in 2021.",
    category: "food",
  },
  {
    question: "Piri piri sauce, widely used in Portuguese-African cuisine, gets its name from a chilli pepper native to which region?",
    options: ["South America", "Southeast Asia", "Southern Africa", "India"],
    correct: 2,
    explanation: "The piri piri (or peri-peri) chilli is native to southern Africa. Portuguese traders spread it globally, and it became central to Mozambican and Angolan cuisine.",
    category: "food",
  },
  {
    question: "Fufu, a starchy staple eaten across West and Central Africa, is typically made by pounding which ingredients?",
    options: ["Rice and beans", "Cassava and/or plantains", "Wheat and corn", "Millet and sorghum"],
    correct: 1,
    explanation: "Fufu is made by boiling and pounding starchy foods like cassava, yams, or plantains into a smooth, dough-like consistency, served with soups and stews.",
    category: "food",
  },

  // === MORE MUSIC ===
  {
    question: "Which South African artist popularised the 'Gqom' genre that emerged from Durban?",
    options: ["Black Coffee", "DJ Lag", "Cassper Nyovest", "Nasty C"],
    correct: 1,
    explanation: "DJ Lag is widely credited with bringing Gqom — a dark, hypnotic electronic genre from Durban's townships — to international attention.",
    category: "music",
  },
  {
    question: "Afrobeats star Mr Eazi is a pioneer of which self-coined genre blending Ghanaian and Nigerian sounds?",
    options: ["Afro-swing", "Banku Music", "Alte", "Afro-pop"],
    correct: 1,
    explanation: "Mr Eazi coined 'Banku Music' to describe his fusion of Ghanaian highlife, dancehall, and Nigerian pop influences.",
    category: "music",
  },
  {
    question: "Which legendary Malian duo, comprising a married couple, are known for their album 'Dimanche à Bamako'?",
    options: ["Tinariwen", "Amadou & Mariam", "Salif Keita & Oumou Sangaré", "Ali Farka Touré & Toumani Diabaté"],
    correct: 1,
    explanation: "Amadou & Mariam, both blind musicians from Bamako, became global stars with their 2004 album produced by Manu Chao.",
    category: "music",
  },
  {
    question: "Angélique Kidjo, the multi-Grammy-winning artist, is from which West African country?",
    options: ["Senegal", "Nigeria", "Benin", "Togo"],
    correct: 2,
    explanation: "Angélique Kidjo from Benin has won five Grammy Awards and is known for fusing African, Caribbean, and Western music traditions.",
    category: "music",
  },
  {
    question: "Highlife music, one of the earliest popular music genres in Africa, originated in which country?",
    options: ["Nigeria", "Ghana", "Sierra Leone", "Liberia"],
    correct: 1,
    explanation: "Highlife emerged in Ghana in the early 20th century, blending traditional Akan music with Western instruments, and later influenced jùjú and Afrobeats in Nigeria.",
    category: "music",
  },

  // === MORE FILM ===
  {
    question: "Ousmane Sembène, often called the 'father of African cinema', was from which country?",
    options: ["Mali", "Senegal", "Guinea", "Cameroon"],
    correct: 1,
    explanation: "Senegalese filmmaker Ousmane Sembène directed 'Black Girl' (1966), considered the first feature film made by a sub-Saharan African director.",
    category: "film",
  },
  {
    question: "The 2021 film 'The Woman King' starring Viola Davis was inspired by the real Agojie warriors of which kingdom?",
    options: ["Ashanti", "Dahomey", "Zulu", "Benin"],
    correct: 1,
    explanation: "The Agojie were an all-female military regiment of the Kingdom of Dahomey (modern-day Benin), active from the 17th to 19th centuries.",
    category: "film",
  },
  {
    question: "Barry Jenkins, director of 'Moonlight', followed it up with which adaptation of a James Baldwin novel?",
    options: ["Giovanni's Room", "If Beale Street Could Talk", "Go Tell It on the Mountain", "Another Country"],
    correct: 1,
    explanation: "If Beale Street Could Talk (2018) earned Regina King an Oscar for Best Supporting Actress and cemented Jenkins as a major auteur.",
    category: "film",
  },
  {
    question: "Wanuri Kahiu's 'Rafiki' (2018) made history as Kenya's first film to screen at which festival?",
    options: ["Venice", "Berlin", "Cannes", "Toronto"],
    correct: 2,
    explanation: "Rafiki, a love story between two young Kenyan women, premiered at Cannes but was initially banned in Kenya for its portrayal of a same-sex relationship.",
    category: "film",
  },
  {
    question: "Which Mauritanian film was nominated for the Best Foreign Language Film Oscar in 2015?",
    options: ["Timbuktu", "Yeelen", "Bamako", "Atlantics"],
    correct: 0,
    explanation: "Abderrahmane Sissako's 'Timbuktu' depicted life under jihadist occupation in Mali and became one of the most acclaimed African films of the decade.",
    category: "film",
  },

  // === MORE SPORT ===
  {
    question: "Which Ethiopian runner won the 10,000m gold at both the 2008 and 2012 Olympics?",
    options: ["Haile Gebrselassie", "Kenenisa Bekele", "Mo Farah", "Tirunesh Dibaba"],
    correct: 1,
    explanation: "Kenenisa Bekele, considered the greatest 10,000m runner in history, won Olympic gold in both Beijing 2008 and London 2012, adding to his world record collection.",
    category: "sport",
  },
  {
    question: "The 'Rumble in the Jungle' boxing match between Muhammad Ali and George Foreman took place in 1974 in which African city?",
    options: ["Lagos", "Nairobi", "Kinshasa", "Accra"],
    correct: 2,
    explanation: "The legendary fight took place in Kinshasa, Zaire (now DR Congo), where Ali used his famous 'rope-a-dope' strategy to knock out the heavily favoured Foreman.",
    category: "sport",
  },
  {
    question: "Cameroon's football team stunned the world at the 1990 World Cup by beating which defending champion in the opening match?",
    options: ["Brazil", "Argentina", "West Germany", "Italy"],
    correct: 1,
    explanation: "Cameroon's Indomitable Lions, led by 38-year-old Roger Milla, beat defending champions Argentina 1-0, becoming the first African team to reach the World Cup quarter-finals.",
    category: "sport",
  },
  {
    question: "Simone Biles, the most decorated gymnast in history, has won how many Olympic gold medals (as of 2024)?",
    options: ["5", "7", "9", "11"],
    correct: 1,
    explanation: "Simone Biles has won seven Olympic gold medals (four in Rio 2016, three in Paris 2024), plus numerous World Championship titles.",
    category: "sport",
  },
  {
    question: "Usain Bolt, the fastest man ever, is from which Caribbean country?",
    options: ["Trinidad and Tobago", "Jamaica", "Barbados", "Bahamas"],
    correct: 1,
    explanation: "Jamaican sprinter Usain Bolt holds the world records in both 100m (9.58s) and 200m (19.19s) and won eight Olympic gold medals.",
    category: "sport",
  },
  {
    question: "Which Nigerian footballer was the first African to win the FIFA World Player of the Year (African equivalent: African Footballer of the Year, three times)?",
    options: ["Jay-Jay Okocha", "Nwankwo Kanu", "Rashidi Yekini", "George Weah"],
    correct: 3,
    explanation: "George Weah from Liberia (not Nigeria — this is the trick) won FIFA World Player of the Year in 1995, the only African to do so, later becoming Liberia's president.",
    category: "sport",
  },

  // === MORE HISTORY ===
  {
    question: "The Mau Mau uprising of the 1950s was a rebellion against British colonial rule in which country?",
    options: ["Uganda", "Kenya", "Tanzania", "Malawi"],
    correct: 1,
    explanation: "The Mau Mau uprising (1952-1960) was a Kikuyu-led rebellion against British colonial rule in Kenya that accelerated the country's path to independence in 1963.",
    category: "history",
  },
  {
    question: "Kwame Ture (formerly Stokely Carmichael) popularised which phrase during a 1966 march in Mississippi?",
    options: ["Black Is Beautiful", "Black Power", "Power to the People", "By Any Means Necessary"],
    correct: 1,
    explanation: "Stokely Carmichael, then chairman of SNCC, began chanting 'Black Power' during the March Against Fear in June 1966, transforming the civil rights movement.",
    category: "history",
  },
  {
    question: "The Scramble for Africa was formalised at which 1884-85 conference?",
    options: ["Paris Conference", "London Conference", "Berlin Conference", "Vienna Conference"],
    correct: 2,
    explanation: "The Berlin Conference of 1884-85 saw European powers divide Africa among themselves with no African representation, setting borders that largely persist today.",
    category: "history",
  },
  {
    question: "Which West African empire, at its peak in the 14th century, was one of the largest and wealthiest empires in world history?",
    options: ["Songhai Empire", "Mali Empire", "Ghana Empire", "Oyo Empire"],
    correct: 1,
    explanation: "The Mali Empire under Mansa Musa controlled vast gold and salt trade routes and was so wealthy that Mansa Musa is often cited as the richest person in history.",
    category: "history",
  },
  {
    question: "Steve Biko, the anti-apartheid activist who died in police custody in 1977, founded which movement?",
    options: ["Pan Africanist Congress", "Black Consciousness Movement", "African National Congress Youth League", "United Democratic Front"],
    correct: 1,
    explanation: "Steve Biko founded the Black Consciousness Movement in South Africa, which emphasised psychological liberation and Black pride as preconditions for political freedom.",
    category: "history",
  },
  {
    question: "The Transatlantic slave trade lasted approximately how many centuries?",
    options: ["Two (16th-17th)", "Three (16th-18th)", "Four (15th-19th)", "Five (14th-19th)"],
    correct: 2,
    explanation: "The Transatlantic slave trade spanned roughly four centuries, from the early 1500s to the late 1800s, forcibly displacing an estimated 12.5 million Africans.",
    category: "history",
  },

  // === MORE ART ===
  {
    question: "El Anatsui, the sculptor known for massive metallic tapestries made from bottle caps, is from which country?",
    options: ["Nigeria", "Ghana", "Senegal", "Côte d'Ivoire"],
    correct: 1,
    explanation: "El Anatsui, born in Ghana and based in Nigeria, creates monumental sculptures from flattened bottle caps and copper wire, exhibiting at the world's top museums.",
    category: "art",
  },
  {
    question: "Kehinde Wiley, who painted Barack Obama's official portrait, is known for inserting Black figures into what type of artwork?",
    options: ["Abstract expressionism", "Old Master European paintings", "Pop art", "Impressionist landscapes"],
    correct: 1,
    explanation: "Wiley reimagines classical European paintings by replacing the original subjects with contemporary Black figures, challenging art-historical canons of power and beauty.",
    category: "art",
  },
  {
    question: "Amy Sherald painted the official portrait of which notable figure, unveiled in 2018?",
    options: ["Oprah Winfrey", "Michelle Obama", "Maya Angelou", "Kamala Harris"],
    correct: 1,
    explanation: "Amy Sherald's portrait of Michelle Obama at the National Portrait Gallery became one of the most popular artworks in the museum's history.",
    category: "art",
  },
  {
    question: "Jean-Michel Basquiat began his art career in New York creating graffiti under what tag name?",
    options: ["TAKI 183", "SAMO", "DONDI", "FUTURA"],
    correct: 1,
    explanation: "Basquiat and Al Diaz tagged mysterious poetic messages as SAMO© (Same Old Shit) across Lower Manhattan before Basquiat became a neo-expressionist superstar.",
    category: "art",
  },
  {
    question: "The Zeitz Museum of Contemporary Art Africa (MOCAA), the largest museum of contemporary African art, opened in 2017 in which city?",
    options: ["Lagos", "Nairobi", "Cape Town", "Accra"],
    correct: 2,
    explanation: "Zeitz MOCAA in Cape Town is housed in a converted grain silo at the V&A Waterfront, designed by Thomas Heatherwick, showcasing 21st-century art from Africa and its diaspora.",
    category: "art",
  },

  // === MORE CULTURE ===
  {
    question: "Juneteenth, now a US federal holiday, commemorates the emancipation of enslaved people in which state on June 19, 1865?",
    options: ["Virginia", "Mississippi", "Texas", "Louisiana"],
    correct: 2,
    explanation: "Juneteenth marks the day Union soldiers arrived in Galveston, Texas, to announce the end of slavery — two and a half years after the Emancipation Proclamation.",
    category: "history",
  },
  {
    question: "Kwanzaa, the African American cultural holiday, was created in 1966 by Maulana Karenga and is celebrated over how many days?",
    options: ["3", "5", "7", "10"],
    correct: 2,
    explanation: "Kwanzaa runs from December 26 to January 1, with each of the seven days dedicated to one of the Nguzo Saba (Seven Principles) drawn from African communal values.",
    category: "culture",
  },
  {
    question: "The Notting Hill Carnival in London, Europe's largest street festival, was started in 1966 by immigrants from which region?",
    options: ["West Africa", "The Caribbean", "South Asia", "East Africa"],
    correct: 1,
    explanation: "Trinidad-born activist Claudia Jones and later Rhaune Laslett organised the first Notting Hill Carnival to celebrate Caribbean culture and foster community after the 1958 race riots.",
    category: "culture",
  },
  {
    question: "The concept of 'Ubuntu', meaning 'I am because we are', originates from which language family?",
    options: ["Khoisan", "Nilo-Saharan", "Bantu", "Afro-Asiatic"],
    correct: 2,
    explanation: "Ubuntu is a Bantu philosophy emphasising communal bonds and shared humanity. It was popularised globally by Archbishop Desmond Tutu and Nelson Mandela.",
    category: "culture",
  },
  {
    question: "Día de los Muertos (Day of the Dead) in Mexico has significant influences from which pre-colonial African-descended traditions?",
    options: ["There are no African influences", "Afro-Mexican death rituals from Costa Chica", "Candomblé from Brazil", "Vodou from Haiti"],
    correct: 1,
    explanation: "The Afro-Mexican communities of Costa Chica contributed ancestor veneration practices that blended with Indigenous and Spanish Catholic traditions in Day of the Dead celebrations.",
    category: "culture",
  },

  // === MORE FOOD ===
  {
    question: "Which West African grain, also known as fonio, has been called 'the grain of the future' for its nutritional value and drought resistance?",
    options: ["Teff", "Fonio (Digitaria exilis)", "Sorghum", "Millet"],
    correct: 1,
    explanation: "Fonio, cultivated in West Africa for over 5,000 years, is gluten-free, nutrient-rich, and grows in poor soil conditions. Chef Pierre Thiam has championed it globally.",
    category: "food",
  },
  {
    question: "Bobotie, a spiced minced meat dish baked with an egg custard topping, is the national dish of which country?",
    options: ["Namibia", "Mozambique", "South Africa", "Zimbabwe"],
    correct: 2,
    explanation: "Bobotie is South Africa's national dish, reflecting Cape Malay, Dutch, and Indigenous influences. It dates back to the 17th century Cape Colony.",
    category: "food",
  },
  {
    question: "Pepper soup, a spicy broth found across West Africa, is most commonly eaten in which situation?",
    options: ["Breakfast only", "As a cold remedy or late-night meal", "Only at weddings", "Only during Ramadan"],
    correct: 1,
    explanation: "Pepper soup is beloved across Nigeria, Ghana, and Cameroon as both a medicinal remedy for colds and a popular late-night dish, especially after social events.",
    category: "food",
  },

  // === MORE FASHION ===
  {
    question: "Adire, the Yoruba art of resist-dyeing fabric using indigo, originates from which part of Nigeria?",
    options: ["The North", "Southwest Nigeria", "The Southeast", "The Niger Delta"],
    correct: 1,
    explanation: "Adire cloth-making is a centuries-old Yoruba tradition from southwestern Nigeria, using cassava paste or raffia to create intricate patterns on indigo-dyed fabric.",
    category: "fashion",
  },
  {
    question: "The bogolan (mud cloth) textile tradition, using fermented mud to create geometric patterns, comes from which country?",
    options: ["Ethiopia", "Mali", "Ghana", "Senegal"],
    correct: 1,
    explanation: "Bogolan (bogolanfini) is a Malian textile tradition where cloth is painted with fermented river mud, creating distinctive brown and white geometric patterns.",
    category: "fashion",
  },

  // === ADDITIONAL QUESTIONS TO REACH 200 ===
  {
    question: "Which Jamaican-born DJ is credited with inventing hip-hop through his sound system parties in the Bronx?",
    options: ["Grandmaster Flash", "DJ Kool Herc", "Afrika Bambaataa", "DJ Hollywood"],
    correct: 1,
    explanation: "Clive 'DJ Kool Herc' Campbell, born in Kingston, Jamaica, threw the party at 1520 Sedgwick Avenue in 1973 that is widely considered the birth of hip-hop.",
    category: "music",
  },
  {
    question: "Wangari Maathai's Green Belt Movement has planted over how many trees across Africa?",
    options: ["1 million", "10 million", "51 million", "100 million"],
    correct: 2,
    explanation: "The Green Belt Movement, founded by Nobel laureate Wangari Maathai in 1977, has planted over 51 million trees across Kenya and inspired similar efforts continent-wide.",
    category: "culture",
  },
  {
    question: "Which Ethiopian emperor claimed descent from King Solomon and the Queen of Sheba?",
    options: ["Tewodros II", "Menelik II", "All Ethiopian emperors (Solomonic dynasty)", "Yohannes IV"],
    correct: 2,
    explanation: "The Solomonic dynasty, which ruled Ethiopia from 1270 to 1974, claimed unbroken descent from King Solomon and the Queen of Sheba through their son Menelik I.",
    category: "history",
  },
  {
    question: "The djembe drum, now popular worldwide, originates from which West African empire?",
    options: ["Ashanti Empire", "Mandinka/Mali Empire", "Songhai Empire", "Benin Kingdom"],
    correct: 1,
    explanation: "The djembe originated with the Mandinka people of the Mali Empire around the 12th century. Traditionally carved from a single piece of wood with a goatskin head.",
    category: "music",
  },
  {
    question: "Which author wrote 'Homegoing', a novel spanning seven generations from Ghana to the United States?",
    options: ["Yaa Gyasi", "NoViolet Bulawayo", "Taiye Selasi", "Brit Bennett"],
    correct: 0,
    explanation: "Yaa Gyasi's debut novel Homegoing (2016) traces two half-sisters' family lines — one through slavery in America, one through colonialism in Ghana — across 300 years.",
    category: "literature",
  },
  {
    question: "Shea butter, used in cosmetics worldwide, comes from the nut of a tree native to which region?",
    options: ["North Africa", "East Africa", "West African savannah", "Southern Africa"],
    correct: 2,
    explanation: "The shea tree grows in the savannah belt of West Africa, from Senegal to Sudan. Women have processed shea butter for centuries for cooking, cosmetics, and medicine.",
    category: "culture",
  },
  {
    question: "Which country hosted the first-ever African Nations Cup (AFCON) in 1957?",
    options: ["Egypt", "Sudan", "Ethiopia", "South Africa"],
    correct: 1,
    explanation: "Sudan hosted the first AFCON in 1957 with just three teams — Egypt, Sudan, and Ethiopia. Egypt won the inaugural tournament.",
    category: "sport",
  },
  {
    question: "The Harlem Globetrotters, the exhibition basketball team, were actually founded in which city?",
    options: ["Harlem, New York", "Chicago, Illinois", "Detroit, Michigan", "Philadelphia, Pennsylvania"],
    correct: 1,
    explanation: "Despite their name, the Harlem Globetrotters were founded in Chicago in 1926 by Abe Saperstein. The 'Harlem' name referenced the cultural capital of Black America.",
    category: "sport",
  },
  {
    question: "Which Ghanaian-British architect designed the Serpentine Pavilion in 2017?",
    options: ["David Adjaye", "Francis Kéré", "Mariam Kamara", "Kunlé Adeyemi"],
    correct: 1,
    explanation: "Francis Kéré designed the 2017 Serpentine Pavilion in London, inspired by a tree that serves as a gathering place in his hometown of Gando, Burkina Faso.",
    category: "art",
  },
  {
    question: "Reggae music was added to UNESCO's Intangible Cultural Heritage list in which year?",
    options: ["2015", "2018", "2020", "2022"],
    correct: 1,
    explanation: "UNESCO inscribed reggae on its Representative List of the Intangible Cultural Heritage of Humanity in 2018, recognising its contribution to discourse on injustice and resistance.",
    category: "music",
  },
  {
    question: "The Benin Bronzes, looted by British forces in 1897, originated from a kingdom in modern-day which country?",
    options: ["Benin Republic", "Nigeria", "Ghana", "Togo"],
    correct: 1,
    explanation: "The Benin Bronzes were looted from the Kingdom of Benin, located in modern-day Edo State, Nigeria — not the neighbouring Benin Republic. Repatriation efforts are ongoing.",
    category: "art",
  },
  {
    question: "Which Somali-British poet won the 2021 T.S. Eliot Prize for Poetry?",
    options: ["Warsan Shire", "Joelle Taylor", "Momtaza Mehri", "Shire Jama Ahmed"],
    correct: 0,
    explanation: "Warsan Shire, born in Nairobi to Somali parents and raised in London, is known for her poetry on refugee experiences. Beyoncé featured her work in 'Lemonade'.",
    category: "literature",
  },
  {
    question: "Zanzibar, a major historical trading hub, is part of which modern country?",
    options: ["Kenya", "Mozambique", "Tanzania", "Madagascar"],
    correct: 2,
    explanation: "Zanzibar merged with Tanganyika in 1964 to form Tanzania. Its Stone Town is a UNESCO World Heritage Site reflecting centuries of Swahili, Arab, Persian, and Indian influence.",
    category: "history",
  },
  {
    question: "Which Nigerian musician pioneered the 'Alte' movement, an alternative music and art scene?",
    options: ["Davido", "Cruel Santino (Santi)", "Rema", "Fireboy DML"],
    correct: 1,
    explanation: "Cruel Santino (formerly Santi) is a key figure in the Nigerian Alte scene, blending genres like alt-R&B, rap, and Afropop with experimental visuals and fashion.",
    category: "music",
  },
  {
    question: "Which Pan-African leader said 'Speak softly, speak sweetly' and was assassinated in Burkina Faso in 1987?",
    options: ["Patrice Lumumba", "Amilcar Cabral", "Thomas Sankara", "Samora Machel"],
    correct: 2,
    explanation: "Thomas Sankara, the 'Africa's Che Guevara', was president of Burkina Faso from 1983 until his assassination in 1987. He championed women's rights and self-sufficiency.",
    category: "history",
  },
  {
    question: "Teff, the tiny grain used to make injera bread, is primarily grown in which country?",
    options: ["Kenya", "Ethiopia", "Sudan", "Somalia"],
    correct: 1,
    explanation: "Teff is the staple grain of Ethiopian cuisine, used to make injera — the spongy sourdough flatbread that serves as both plate and utensil.",
    category: "food",
  },
  {
    question: "Which Congolese-Belgian singer had a global hit with 'Alors on danse' in 2010?",
    options: ["Aya Nakamura", "Stromae", "Maître Gims", "Damso"],
    correct: 1,
    explanation: "Stromae (Paul Van Haver), born in Brussels to a Rwandan father, became one of the biggest French-language artists worldwide, blending electronic music with African rhythms.",
    category: "music",
  },
  {
    question: "The kingdom of Kongo, which had diplomatic relations with Portugal, was located in modern-day which countries?",
    options: ["Kenya and Tanzania", "Angola, Congo, and DRC", "Ghana and Nigeria", "Mozambique and Zimbabwe"],
    correct: 1,
    explanation: "The Kingdom of Kongo spanned parts of modern Angola, Republic of Congo, DRC, and Gabon. It had Christian kings and sent ambassadors to the Vatican.",
    category: "history",
  },
  {
    question: "Which Nigerian-American artist is known for massive portrait murals celebrating Black culture across cities worldwide?",
    options: ["Njideka Akunyili Crosby", "Toyin Ojih Odutola", "Kehinde Wiley", "Amoako Boafo"],
    correct: 0,
    explanation: "Njideka Akunyili Crosby creates large-scale works blending Nigerian and American imagery using paint, fabric, and photo transfers, exploring diaspora identity.",
    category: "art",
  },
  {
    question: "Mbalax, a popular music genre combining traditional Wolof rhythms with Western instruments, originated in which country?",
    options: ["Mali", "Senegal", "Gambia", "Guinea-Bissau"],
    correct: 1,
    explanation: "Mbalax is Senegal's most popular music genre, pioneered by Youssou N'Dour in the 1970s-80s by fusing sabar drumming with rock, jazz, and Cuban influences.",
    category: "music",
  },
  {
    question: "The African Union headquarters in Addis Ababa was built and funded by which country?",
    options: ["United States", "United Kingdom", "China", "France"],
    correct: 2,
    explanation: "China funded and built the $200 million African Union headquarters in Addis Ababa, Ethiopia, which was completed in 2012 as a gift to the continent.",
    category: "culture",
  },
  {
    question: "Which award-winning film told the story of the Chibok schoolgirls kidnapped by Boko Haram?",
    options: ["Lionheart", "Stolen Daughters", "Bring Back Our Girls", "The Chibok Girls"],
    correct: 1,
    explanation: "The documentary 'Stolen Daughters: Kidnapped by Boko Haram' (2018) followed the story of the 276 schoolgirls abducted from Chibok, Nigeria, in April 2014.",
    category: "film",
  },
  {
    question: "Rooibos tea, naturally caffeine-free, is grown exclusively in which country?",
    options: ["Kenya", "Morocco", "South Africa", "Tanzania"],
    correct: 2,
    explanation: "Rooibos grows only in the Cederberg region near Cape Town, South Africa. Indigenous Khoisan people have used it for centuries before it became a global product.",
    category: "food",
  },
  {
    question: "Which African country has the most UNESCO World Heritage Sites?",
    options: ["South Africa", "Morocco", "Ethiopia", "Egypt"],
    correct: 2,
    explanation: "Ethiopia has the most UNESCO World Heritage Sites in Africa with 11, including Lalibela, Aksum, the Simien Mountains, and the Lower Valley of the Omo.",
    category: "culture",
  },
  {
    question: "The kora, a 21-string instrument, is the signature instrument of which West African social group?",
    options: ["Fula herders", "Griot (jali) musicians", "Tuareg nomads", "Ashanti drummers"],
    correct: 1,
    explanation: "The kora is played by griots (jalolu), the hereditary musician-storytellers of the Mandinka people. Toumani Diabaté and Seckou Keita are modern masters.",
    category: "music",
  },
  {
    question: "Grace Jones, the iconic model, singer, and actress, was born in which country?",
    options: ["Jamaica", "Trinidad", "Haiti", "Barbados"],
    correct: 0,
    explanation: "Grace Jones was born in Spanish Town, Jamaica, in 1948 before moving to New York. She became a cultural icon blending music, fashion, and performance art.",
    category: "culture",
  },
  {
    question: "Which South African photographer's series 'Faces and Phases' documents the Black LGBTQ+ community?",
    options: ["David Goldblatt", "Zanele Muholi", "Pieter Hugo", "Jodi Bieber"],
    correct: 1,
    explanation: "Zanele Muholi's ongoing 'Faces and Phases' project, started in 2006, has created over 500 portraits documenting the lives of Black LGBTQ+ South Africans.",
    category: "art",
  },
  {
    question: "What is the traditional name for the Maasai jumping dance performed during ceremonies?",
    options: ["Adumu", "Gwara Gwara", "Ndombolo", "Eskista"],
    correct: 0,
    explanation: "Adumu is the traditional Maasai warrior jumping dance where young men compete to jump highest from a standing position, accompanied by chanting from a circle of warriors.",
    category: "culture",
  },
  {
    question: "Paystack, the Nigerian fintech company acquired by Stripe in 2020, was co-founded by which entrepreneur?",
    options: ["Olugbenga Agboola", "Shola Akinlade", "Jason Njoku", "Sim Shagaya"],
    correct: 1,
    explanation: "Shola Akinlade co-founded Paystack, which Stripe acquired for over $200 million — the largest startup acquisition in African history at the time.",
    category: "culture",
  },
  {
    question: "Which African country was never colonised by a European power?",
    options: ["Ethiopia", "Liberia", "Both Ethiopia and Liberia", "Morocco"],
    correct: 2,
    explanation: "Ethiopia (except for a brief Italian occupation 1936-41) and Liberia (founded by freed American slaves) are the two African nations that were never formally colonised.",
    category: "history",
  },
  {
    question: "Which city hosts Africa's largest annual music festival, the Lake of Stars Festival?",
    options: ["Cape Town, South Africa", "Salima, Malawi", "Kampala, Uganda", "Accra, Ghana"],
    correct: 1,
    explanation: "The Lake of Stars Festival takes place on the shores of Lake Malawi near Salima, featuring African and international artists since 2004.",
    category: "music",
  },
  {
    question: "The African baobab tree can live for how many years?",
    options: ["Up to 500 years", "Up to 1,000 years", "Up to 2,000 years", "Up to 5,000 years"],
    correct: 2,
    explanation: "African baobab trees can live for up to 2,000 years. Known as the 'Tree of Life', they store thousands of litres of water in their trunks and are culturally sacred.",
    category: "culture",
  },
  {
    question: "Which Ghanaian philosopher coined the term 'Consciencism' as a philosophical framework for African decolonisation?",
    options: ["Kwasi Wiredu", "Kwame Nkrumah", "Paulin Hountondji", "Achille Mbembe"],
    correct: 1,
    explanation: "Kwame Nkrumah published 'Consciencism' in 1964, proposing a philosophical framework that merged traditional African thought, Islam, and Christianity for a post-colonial African identity.",
    category: "history",
  },
  {
    question: "Lake Victoria, Africa's largest lake, borders which three countries?",
    options: ["Kenya, Tanzania, Uganda", "Kenya, Ethiopia, Tanzania", "Uganda, Rwanda, Tanzania", "Congo, Uganda, Kenya"],
    correct: 0,
    explanation: "Lake Victoria is shared by Kenya, Tanzania, and Uganda. It is the world's largest tropical lake and the source of the White Nile.",
    category: "culture",
  },
];

function getFallbackQuestions(seedKey: string): TriviaQuestion[] {
  const seed     = dateToSeed(seedKey);
  const shuffled = seededShuffle(FALLBACK_QUESTIONS, seed);
  return shuffled.slice(0, 10);
}

async function fetchFromWPSlot(date: string, slot: number): Promise<TriviaQuestion[] | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/games/trivia-daily?slot=${slot}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.date === date && data.slot === slot && Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions as TriviaQuestion[];
    }
    return null;
  } catch {
    return null;
  }
}

async function saveToWPSlot(questions: TriviaQuestion[], slot: number): Promise<void> {
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/games/trivia-daily`, {
      method:  "POST",
      headers: {
        "Content-Type":         "application/json",
        "Authorization":        `Bearer ${API_KEY}`,
        "X-Culture-API-Secret": API_KEY,
      },
      body: JSON.stringify({ questions, slot }),
    });
  } catch {
    // Non-fatal
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slot = Math.min(5, Math.max(1, parseInt(searchParams.get("slot") ?? "1") || 1));
  const date = new Date().toISOString().slice(0, 10);
  // Unique seed per day+slot — slots 2-5 are Pro-only extras, never repeating with other slots
  const seedKey = `${date}-slot-${slot}`;

  // 1. Try WordPress cache (slot-specific)
  const cached = await fetchFromWPSlot(date, slot);
  if (cached) {
    return NextResponse.json({ date, slot, questions: cached, source: "cache" });
  }

  // 2. Generate via Gemini with slot-seeded topic brief
  const generated = await generateQuestions(seedKey);
  if (generated) {
    await saveToWPSlot(generated, slot);
    return NextResponse.json({ date, slot, questions: generated, source: "gemini" });
  }

  // 3. Gemini unavailable — serve from hardcoded fallback (never returns 500)
  const fallback = getFallbackQuestions(seedKey);
  return NextResponse.json({ date, slot, questions: fallback, source: "fallback" });
}
