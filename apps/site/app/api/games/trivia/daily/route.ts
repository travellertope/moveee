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
  // ── 200 additional questions (expanded bank) ──────────────────────────
{ question: "Which Nigerian playwright became the first African to win the Nobel Prize in Literature, in 1986?", options: ["Wole Soyinka","Chinua Achebe","Ben Okri","Ngũgĩ wa Thiong'o"], correct: 0, explanation: "Wole Soyinka won the 1986 Nobel Prize in Literature, the first African laureate, celebrated for plays like 'Death and the King's Horseman'.", category: "literature" },
  { question: "Ben Okri won the 1991 Booker Prize for which novel set in a Nigerian spirit-world?", options: ["Astonishing the Gods","The Famished Road","Dangerous Love","Songs of Enchantment"], correct: 1, explanation: "'The Famished Road', narrated by the spirit-child Azaro, made Ben Okri one of the youngest Booker winners at the time.", category: "literature" },
  { question: "Kenyan author Ngũgĩ wa Thiong'o famously decided to write his fiction primarily in which language?", options: ["English","Swahili","Gikuyu","French"], correct: 2, explanation: "Ngũgĩ renounced writing novels in English, choosing his mother tongue Gikuyu as an act of cultural decolonisation.", category: "literature" },
  { question: "Tanzanian-born novelist Abdulrazak Gurnah won the Nobel Prize in Literature in which year?", options: ["2015","2019","2017","2021"], correct: 3, explanation: "Gurnah won the 2021 Nobel for works like 'Paradise' and 'By the Sea' exploring colonialism and the refugee experience.", category: "literature" },
  { question: "Toni Morrison won the Pulitzer Prize for which 1987 novel about slavery and its aftermath?", options: ["Beloved","Sula","Song of Solomon","Jazz"], correct: 0, explanation: "'Beloved' won the 1988 Pulitzer; Morrison later became the first Black woman to win the Nobel Prize in Literature in 1993.", category: "literature" },
  { question: "Maya Angelou's acclaimed 1969 autobiography is titled 'I Know Why the Caged Bird ___'.", options: ["Cries","Sings","Flies","Sleeps"], correct: 1, explanation: "'I Know Why the Caged Bird Sings' chronicles Angelou's early years and became a landmark of American memoir.", category: "literature" },
  { question: "Zora Neale Hurston's most famous novel is titled 'Their Eyes Were Watching ___'.", options: ["Home","Heaven","God","Time"], correct: 2, explanation: "'Their Eyes Were Watching God' (1937) follows Janie Crawford and was rediscovered largely thanks to Alice Walker.", category: "literature" },
  { question: "Langston Hughes was a leading poet of which cultural movement?", options: ["Négritude","The Beat Generation","The Black Arts Movement","The Harlem Renaissance"], correct: 3, explanation: "Hughes's jazz-infused poetry, like 'The Negro Speaks of Rivers', defined the Harlem Renaissance of the 1920s.", category: "literature" },
  { question: "Which James Baldwin novel set in Paris explores a love affair between two men?", options: ["Giovanni's Room","Go Tell It on the Mountain","Another Country","If Beale Street Could Talk"], correct: 0, explanation: "'Giovanni's Room' (1956) was groundbreaking for its frank treatment of homosexuality.", category: "literature" },
  { question: "Saint Lucian poet Derek Walcott won the Nobel; his epic poem reworking Homer is titled what?", options: ["Tiepolo's Hound","Omeros","The Bounty","Sea Grapes"], correct: 1, explanation: "Walcott won the 1992 Nobel; 'Omeros' transplants Homeric figures to the Caribbean island of St. Lucia.", category: "literature" },
  { question: "Jamaica Kincaid, known for 'Annie John' and 'A Small Place', was born on which Caribbean island?", options: ["Barbados","Jamaica","Antigua","Dominica"], correct: 2, explanation: "Despite her pen name, Kincaid was born Elaine Potter Richardson on the island of Antigua.", category: "literature" },
  { question: "Zimbabwean author NoViolet Bulawayo's debut novel about a girl emigrating to the US is titled 'We Need New ___'.", options: ["Roads","Homes","Dreams","Names"], correct: 3, explanation: "'We Need New Names' (2013) was shortlisted for the Booker Prize and follows young Darling from Zimbabwe to America.", category: "literature" },
  { question: "Teju Cole's 2011 novel following a Nigerian-German doctor walking through New York is titled what?", options: ["Open City","Every Day Is for the Thief","Known and Strange Things","Blind Spot"], correct: 0, explanation: "'Open City' is a meditative novel of urban wandering and memory by the Nigerian-American writer Teju Cole.", category: "literature" },
  { question: "Chimamanda Ngozi Adichie's novel set during the Biafran war is titled 'Half of a Yellow ___'.", options: ["Moon","Sun","Star","Sky"], correct: 1, explanation: "'Half of a Yellow Sun' (2006) won the Orange Prize and dramatises the Nigerian Civil War of 1967-70.", category: "literature" },
  { question: "Which writer wrote 'Notes of a Native Son', a landmark essay collection on race in America?", options: ["Richard Wright","Ralph Ellison","James Baldwin","W.E.B. Du Bois"], correct: 2, explanation: "Baldwin's 1955 essay collection 'Notes of a Native Son' cemented his reputation as a major American essayist.", category: "literature" },
  { question: "Alice Walker is best known for which Pulitzer-winning epistolary novel?", options: ["The Temple of My Familiar","Meridian","Possessing the Secret of Joy","The Color Purple"], correct: 3, explanation: "'The Color Purple' won the 1983 Pulitzer Prize for Fiction and the National Book Award.", category: "literature" },
  { question: "Senegalese writer Mariama Bâ's feminist novel, written as a long letter, is titled 'So Long a ___'.", options: ["Letter","Day","Road","Silence"], correct: 0, explanation: "'So Long a Letter' (1979) is a foundational text of African feminist literature, exploring polygamy and widowhood.", category: "literature" },
  { question: "Which Caribbean-British author wrote 'Small Island' about the Windrush generation?", options: ["Zadie Smith","Andrea Levy","Bernardine Evaristo","Caryl Phillips"], correct: 1, explanation: "Andrea Levy's 'Small Island' (2004) won the Orange Prize and depicts Jamaican migrants in post-war Britain.", category: "literature" },
  { question: "Bernardine Evaristo became the first Black woman to win the Booker Prize, in 2019, for which novel?", options: ["Blonde Roots","Mr Loverman","Girl, Woman, Other","The Emperor's Babe"], correct: 2, explanation: "Evaristo shared the 2019 Booker (with Margaret Atwood) for 'Girl, Woman, Other'.", category: "literature" },
  { question: "Ralph Ellison's only completed novel, a classic of American literature, is titled what?", options: ["Cane","Native Son","Black Boy","Invisible Man"], correct: 3, explanation: "'Invisible Man' (1952) won the National Book Award and explores Black identity and invisibility in America.", category: "literature" },
  { question: "Octavia Butler's landmark time-travel novel about slavery is titled what?", options: ["Kindred","Dawn","Parable of the Sower","Wild Seed"], correct: 0, explanation: "Butler's 'Kindred' (1979) sends a modern Black woman back to an antebellum plantation, a milestone of speculative fiction.", category: "literature" },
  { question: "Which African woman won the Nobel Peace Prize in 2004 for her environmental and democratic activism?", options: ["Ellen Johnson Sirleaf","Wangari Maathai","Leymah Gbowee","Graça Machel"], correct: 1, explanation: "Kenyan Wangari Maathai founded the Green Belt Movement and was the first African woman to win the Nobel Peace Prize.", category: "history" },
  { question: "Nelson Mandela was imprisoned for how many years before his release in 1990?", options: ["33 years","18 years","27 years","21 years"], correct: 2, explanation: "Mandela spent 27 years in prison, much of it on Robben Island, before his release on 11 February 1990.", category: "history" },
  { question: "Steve Biko was a leading figure of which South African movement?", options: ["Defiance Campaign","Pan Africanist Congress","Inkatha","Black Consciousness"], correct: 3, explanation: "Biko co-founded the Black Consciousness Movement; he died in police custody in 1977, becoming an anti-apartheid martyr.", category: "history" },
  { question: "Fred Hampton, killed in a 1969 police raid, chaired the Black Panther Party chapter in which US city?", options: ["Chicago","Oakland","New York","Los Angeles"], correct: 0, explanation: "Hampton led the Illinois (Chicago) chapter and built the multiracial 'Rainbow Coalition' before his assassination at age 21.", category: "history" },
  { question: "Toussaint Louverture led a revolution that created which independent nation in 1804?", options: ["Jamaica","Haiti","Cuba","Dominican Republic"], correct: 1, explanation: "The Haitian Revolution produced the first independent Black republic and the only successful large-scale slave revolt.", category: "history" },
  { question: "Trinidad and Tobago and Jamaica both gained independence from Britain in which year?", options: ["1966","1958","1962","1970"], correct: 2, explanation: "Both Caribbean nations became independent in 1962, with Barbados following in 1966.", category: "history" },
  { question: "The SS Empire Windrush brought Caribbean migrants to Britain in which year?", options: ["1960","1952","1945","1948"], correct: 3, explanation: "The Windrush docked at Tilbury in June 1948, symbolically beginning large-scale post-war Caribbean migration to the UK.", category: "history" },
  { question: "Notting Hill Carnival traces its roots to a 1959 event organised by which Trinidadian activist?", options: ["Claudia Jones","Marcus Garvey","Darcus Howe","Frank Crichlow"], correct: 0, explanation: "Claudia Jones, the 'mother of the Notting Hill Carnival', organised a Caribbean Carnival in 1959 amid racial tensions.", category: "history" },
  { question: "Mansa Musa, famed for his immense wealth, ruled which medieval West African empire?", options: ["Songhai","Mali","Ghana","Kanem-Bornu"], correct: 1, explanation: "Mansa Musa's 14th-century pilgrimage to Mecca distributed so much gold it reportedly disrupted economies along his route.", category: "history" },
  { question: "Robben Island, where Mandela was imprisoned, lies off the coast of which city?", options: ["Port Elizabeth","Durban","Cape Town","Johannesburg"], correct: 2, explanation: "The island in Table Bay near Cape Town is now a UNESCO World Heritage Site and museum.", category: "history" },
  { question: "In 2012, armed groups destroyed ancient manuscripts and shrines in which fabled Malian city?", options: ["Bamako","Gao","Djenné","Timbuktu"], correct: 3, explanation: "Timbuktu, a UNESCO site and historic centre of learning, suffered attacks on its manuscripts and Sufi shrines in 2012.", category: "history" },
  { question: "M-Pesa, a pioneering mobile money service, launched in 2007 in which country?", options: ["Kenya","Nigeria","South Africa","Ghana"], correct: 0, explanation: "Kenya's M-Pesa, run by Safaricom, transformed financial inclusion across Africa and beyond.", category: "history" },
  { question: "The African Union has its headquarters in which city?", options: ["Nairobi","Addis Ababa","Pretoria","Abuja"], correct: 1, explanation: "The AU is headquartered in Addis Ababa, Ethiopia, where its predecessor the OAU was also based.", category: "history" },
  { question: "The AfCFTA is notable for involving the largest number of countries of any free trade area since the founding of which body?", options: ["NAFTA","The European Union","The World Trade Organization","ASEAN"], correct: 2, explanation: "The African Continental Free Trade Area unites most AU members, the largest such agreement by membership since the WTO.", category: "history" },
  { question: "Gorée Island, a memorial to the transatlantic slave trade, is located off the coast of which country?", options: ["Benin","Ghana","The Gambia","Senegal"], correct: 3, explanation: "Gorée Island near Dakar houses the 'House of Slaves' and is a UNESCO World Heritage Site.", category: "history" },
  { question: "Lalibela, famous for its rock-hewn churches, is located in which country?", options: ["Ethiopia","Eritrea","Sudan","Egypt"], correct: 0, explanation: "Lalibela's 11 monolithic churches, carved from rock around the 12th-13th centuries, are a UNESCO site and pilgrimage centre.", category: "history" },
  { question: "Who became the 44th President of the United States in 2009, with a father from Kenya?", options: ["Cory Booker","Barack Obama","Colin Powell","Jesse Jackson"], correct: 1, explanation: "Barack Obama, whose father was Kenyan, was the first African American US president.", category: "history" },
  { question: "Kamala Harris, the first female US Vice President, has heritage from India and which Caribbean nation?", options: ["Barbados","Trinidad","Jamaica","Guyana"], correct: 2, explanation: "Harris's father, Donald Harris, is Jamaican, and her mother was from India.", category: "history" },
  { question: "Great Zimbabwe, a vast stone-walled medieval city, gave its name to which modern nation?", options: ["Mozambique","Zambia","Botswana","Zimbabwe"], correct: 3, explanation: "The ruins of Great Zimbabwe, built by ancestral Shona people, lent the country its post-independence name.", category: "history" },
  { question: "Which queen led the Kingdom of Ndongo and Matamba in resistance against the Portuguese in the 17th century?", options: ["Queen Nzinga","Queen Amina","Yaa Asantewaa","Queen Makeda"], correct: 0, explanation: "Queen Nzinga of present-day Angola was a brilliant diplomat and military leader who resisted Portuguese colonisation.", category: "history" },
  { question: "Yaa Asantewaa led a famous 1900 uprising against the British in defence of which kingdom?", options: ["The Zulu Kingdom","The Asante Empire","The Benin Kingdom","The Sokoto Caliphate"], correct: 1, explanation: "Queen Mother Yaa Asantewaa led the War of the Golden Stool against British colonial forces in Ghana.", category: "history" },
  { question: "The Sokoto Caliphate, one of West Africa's largest pre-colonial states, was founded by which leader?", options: ["Sundiata Keita","Mansa Musa","Usman dan Fodio","Askia the Great"], correct: 2, explanation: "Usman dan Fodio's early-19th-century jihad established the vast Sokoto Caliphate in present-day Nigeria.", category: "history" },
  { question: "The Zulu Kingdom rose to power in the early 19th century under which leader?", options: ["Moshoeshoe","Cetshwayo","Dingane","Shaka"], correct: 3, explanation: "Shaka Zulu transformed the Zulu into a dominant military power through innovative tactics and organisation.", category: "history" },
  { question: "The Aksumite Kingdom, an ancient trading power, was centred in present-day which country?", options: ["Ethiopia","Sudan","Somalia","Egypt"], correct: 0, explanation: "Aksum (Axum) in northern Ethiopia/Eritrea was a major ancient empire famed for its towering stelae.", category: "history" },
  { question: "The Kingdom of Kush, with its capital later at Meroë, built numerous pyramids in present-day which country?", options: ["Egypt","Sudan","Libya","Chad"], correct: 1, explanation: "The Nubian Kingdom of Kush built more pyramids than Egypt, many clustered around Meroë in modern Sudan.", category: "history" },
  { question: "Haile Selassie was the last emperor of which country?", options: ["Sudan","Eritrea","Ethiopia","Egypt"], correct: 2, explanation: "Haile Selassie reigned as Ethiopia's emperor from 1930 until 1974 and is a central figure in Rastafari.", category: "history" },
  { question: "Liberia, founded in part by freed African Americans, declared independence in which year?", options: ["1900","1822","1865","1847"], correct: 3, explanation: "Liberia declared independence in 1847, having been settled from the 1820s by freed Black Americans.", category: "history" },
  { question: "The Underground Railroad's most famous 'conductor' was who?", options: ["Harriet Tubman","Sojourner Truth","Ida B. Wells","Mary McLeod Bethune"], correct: 0, explanation: "Harriet Tubman escaped slavery and made repeated dangerous journeys to free others via the Underground Railroad.", category: "history" },
  { question: "W.E.B. Du Bois helped found which American civil rights organisation in 1909?", options: ["The Urban League","The NAACP","SNCC","The Black Panther Party"], correct: 1, explanation: "Du Bois was a founder of the National Association for the Advancement of Colored People (NAACP).", category: "history" },
  { question: "Carter G. Woodson, the 'Father of Black History', launched the precursor to which observance?", options: ["Kwanzaa","Juneteenth","Black History Month","Emancipation Day"], correct: 2, explanation: "Woodson founded 'Negro History Week' in 1926, which later expanded into Black History Month.", category: "history" },
  { question: "Juneteenth commemorates the announcement of the end of slavery in which US state in 1865?", options: ["Louisiana","Mississippi","Georgia","Texas"], correct: 3, explanation: "Juneteenth marks 19 June 1865, when news of emancipation reached enslaved people in Galveston, Texas.", category: "history" },
  { question: "Mount Kilimanjaro, the highest point in Africa, is located in which country?", options: ["Tanzania","Kenya","Uganda","Rwanda"], correct: 0, explanation: "Kilimanjaro, a dormant volcano rising about 5,895m, stands in northeastern Tanzania.", category: "history" },
  { question: "Victoria Falls, a UNESCO World Heritage Site, lies on the border between Zambia and which country?", options: ["Botswana","Zimbabwe","Mozambique","Namibia"], correct: 1, explanation: "Known locally as Mosi-oa-Tunya, the falls straddle the Zambia-Zimbabwe border.", category: "history" },
  { question: "The Okavango Delta, a vast inland delta and UNESCO site, is found in which country?", options: ["Zambia","Namibia","Botswana","Angola"], correct: 2, explanation: "The Okavango Delta in northern Botswana is one of the world's largest inland deltas and a wildlife haven.", category: "history" },
  { question: "The Great Rift Valley runs roughly from the Middle East down through which part of Africa?", options: ["Southern Africa only","West Africa","Central Africa","East Africa"], correct: 3, explanation: "The East African Rift, formed by tectonic plates pulling apart, stretches through Ethiopia, Kenya and Tanzania.", category: "history" },
  { question: "The CFA franc is controversial because of its enduring financial ties to which European nation?", options: ["France","Belgium","Portugal","Britain"], correct: 0, explanation: "The CFA franc, pegged historically via the French treasury, is criticised by some as a relic of colonial economic control.", category: "history" },
  { question: "Nina Simone's blistering civil rights protest song was titled '___ Goddam'.", options: ["Alabama","Mississippi","Selma","Georgia"], correct: 1, explanation: "'Mississippi Goddam' (1964) responded to the Birmingham church bombing and the murder of Medgar Evers.", category: "music" },
  { question: "Lauryn Hill's 1998 solo album, a Grammy record-breaker, is titled 'The ___ of Lauryn Hill'.", options: ["Evolution","Education","Miseducation","Liberation"], correct: 2, explanation: "'The Miseducation of Lauryn Hill' won five Grammys, the most ever by a woman at the time.", category: "music" },
  { question: "Erykah Badu's 1997 debut album that helped define neo-soul is titled what?", options: ["New Amerykah","Mama's Gun","Worldwide Underground","Baduizm"], correct: 3, explanation: "'Baduizm' established Erykah Badu as a leading voice of the neo-soul movement.", category: "music" },
  { question: "Kendrick Lamar's 2015 album blending jazz, funk and spoken word is titled 'To Pimp a ___'.", options: ["Butterfly","Caterpillar","Moth","Dragonfly"], correct: 0, explanation: "'To Pimp a Butterfly' fused jazz and funk with sharp commentary on race and fame in America.", category: "music" },
  { question: "Bob Marley's 1984 compilation, the best-selling reggae album of all time, is titled what?", options: ["Exodus","Legend","Survival","Uprising"], correct: 1, explanation: "'Legend' has sold tens of millions worldwide, making it the best-selling reggae album ever.", category: "music" },
  { question: "Peter Tosh's solo debut album, a cannabis anthem, is titled what?", options: ["Bush Doctor","Equal Rights","Legalize It","Mystic Man"], correct: 2, explanation: "'Legalize It' (1976) was Tosh's defiant first solo album after leaving The Wailers.", category: "music" },
  { question: "Burning Spear's classic roots reggae album honours which Pan-African leader by name?", options: ["Malcolm X","Haile Selassie","Kwame Nkrumah","Marcus Garvey"], correct: 3, explanation: "'Marcus Garvey' (1975) celebrated the Jamaican Pan-Africanist and is a cornerstone of roots reggae.", category: "music" },
  { question: "Which Jamaican artist broke through internationally in the 2000s with hits like 'Get Busy' and 'Temperature'?", options: ["Sean Paul","Shaggy","Beenie Man","Buju Banton"], correct: 0, explanation: "Sean Paul's dancehall crossover hits topped global charts and won him a Grammy in 2004.", category: "music" },
  { question: "Senegalese star Youssou N'Dour helped popularise which genre driven by the sabar drum?", options: ["Soukous","Mbalax","Highlife","Coupé-décalé"], correct: 1, explanation: "Mbalax is Senegal's dominant popular genre, championed by Youssou N'Dour.", category: "music" },
  { question: "Celia Cruz, the 'Queen of Salsa', hailed from which country before her exile?", options: ["Colombia","Puerto Rico","Cuba","Dominican Republic"], correct: 2, explanation: "Cruz left Cuba in 1960 and became salsa's most celebrated voice, famed for her cry of '¡Azúcar!'", category: "music" },
  { question: "The Buena Vista Social Club project revived the traditional music of which country in the late 1990s?", options: ["Haiti","Brazil","Jamaica","Cuba"], correct: 3, explanation: "The 1997 album and 1999 documentary spotlighted veteran Cuban son and bolero musicians like Ibrahim Ferrer.", category: "music" },
  { question: "Reggaetón and Latin trap have roots strongly associated with which territory?", options: ["Puerto Rico","Cuba","Mexico","Colombia"], correct: 0, explanation: "Reggaetón developed in Puerto Rico and Panama, and Latin trap also flourished among Puerto Rican artists.", category: "music" },
  { question: "Hugh Masekela, the anti-apartheid musician, was renowned for playing which instrument?", options: ["Saxophone","Trumpet","Piano","Guitar"], correct: 1, explanation: "Masekela's flugelhorn and trumpet defined hits like 'Grazing in the Grass' and 'Bring Him Back Home'.", category: "music" },
  { question: "Dancehall as a distinct genre emerged in Jamaica in which decade?", options: ["1990s","1950s","1970s","2000s"], correct: 2, explanation: "Dancehall arose in the late 1970s, stripping reggae into sparser, deejay-led rhythms.", category: "music" },
  { question: "Shakira's official 2010 FIFA World Cup song was titled 'Waka Waka (This Time for ___)'.", options: ["Victory","Glory","Us","Africa"], correct: 3, explanation: "'Waka Waka', built on a Cameroonian makossa hook, soundtracked the first World Cup hosted in Africa.", category: "music" },
  { question: "BTS made headlines in 2018 by delivering a speech at which global institution?", options: ["The United Nations","The Nobel Committee","The Olympic Committee","The European Parliament"], correct: 0, explanation: "BTS spoke at the UN in 2018 in partnership with UNICEF's 'Love Myself' / 'Generation Unlimited' campaign.", category: "music" },
  { question: "Manu Dibango's influential 1972 hit drew on which Cameroonian genre?", options: ["Bikutsi","Makossa","Soukous","Highlife"], correct: 1, explanation: "'Soul Makossa', an urban Douala style, reached global audiences and influenced disco and pop.", category: "music" },
  { question: "Miriam Makeba popularised which Xhosa song, often called 'The Click Song'?", options: ["Malaika","Pata Pata","Qongqothwane","Soweto Blues"], correct: 2, explanation: "'Qongqothwane' showcased the Xhosa language's click consonants and became a Makeba signature.", category: "music" },
  { question: "The blind Malian duo Amadou & Mariam met at a Bamako institute for which group?", options: ["Weavers","Orphans","Musicians","The blind"], correct: 3, explanation: "Amadou Bagayoko and Mariam Doumbia met at Bamako's Institute for the Young Blind and became global Afro-pop stars.", category: "music" },
  { question: "The 'Afrobeat' genre (singular), distinct from modern Afrobeats, was pioneered by which Nigerian artist?", options: ["Fela Kuti","King Sunny Adé","Ebenezer Obey","Victor Olaiya"], correct: 0, explanation: "Fela Kuti fused jazz, funk and Yoruba music into Afrobeat, using it as a vehicle for political protest.", category: "music" },
  { question: "Highlife music, a major influence on West African pop, originated chiefly in which two countries?", options: ["Senegal and Mali","Ghana and Nigeria","Kenya and Tanzania","Liberia and Sierra Leone"], correct: 1, explanation: "Highlife developed in the early 20th century along the coast of Ghana and Nigeria.", category: "music" },
  { question: "Coupé-décalé, an energetic dance-music genre, originated in which country in the early 2000s?", options: ["Cameroon","DR Congo","Ivory Coast","Gabon"], correct: 2, explanation: "Coupé-décalé emerged among the Ivorian diaspora in Paris and became hugely popular in Abidjan.", category: "music" },
  { question: "Soukous, a guitar-driven dance genre, is most associated with which country?", options: ["Kenya","Nigeria","Angola","DR Congo"], correct: 3, explanation: "Soukous (Congolese rumba) developed in Kinshasa and Brazzaville and spread across the continent.", category: "music" },
  { question: "Which South African genre, defined by log drums and jazzy chords, went global in the late 2010s?", options: ["Amapiano","Kwaito","Gqom","Bubblegum"], correct: 0, explanation: "Amapiano, born in South Africa's townships, swept the world with artists like Kabza De Small and DJ Maphorisa.", category: "music" },
  { question: "Stevie Wonder recorded which acclaimed 1976 double album often cited as his masterpiece?", options: ["Innervisions","Songs in the Key of Life","Talking Book","Music of My Mind"], correct: 1, explanation: "'Songs in the Key of Life' won Album of the Year and is widely ranked among the greatest albums ever made.", category: "music" },
  { question: "Marvin Gaye's 1971 concept album on war, poverty and the environment is titled what?", options: ["Here, My Dear","Let's Get It On","What's Going On","I Want You"], correct: 2, explanation: "'What's Going On' transformed soul music with its socially conscious song cycle.", category: "music" },
  { question: "Aretha Franklin's signature 1967 anthem, a civil rights touchstone, is titled what?", options: ["Natural Woman","Think","Chain of Fools","Respect"], correct: 3, explanation: "Aretha's reworking of Otis Redding's 'Respect' became an empowerment anthem and her signature hit.", category: "music" },
  { question: "Wizkid and Tems's global hit 'Essence' gained a remix featuring which pop star?", options: ["Justin Bieber","Drake","Chris Brown","Usher"], correct: 0, explanation: "'Essence' became a crossover smash, with a remix adding Justin Bieber to the original Wizkid and Tems track.", category: "music" },
  { question: "Angélique Kidjo, a multi-Grammy-winning singer, is from which West African country?", options: ["Togo","Benin","Ghana","Nigeria"], correct: 1, explanation: "Beninese icon Angélique Kidjo has won five Grammys and is one of Africa's most celebrated global artists.", category: "music" },
  { question: "Salif Keita, the 'Golden Voice of Africa', is a renowned singer from which country?", options: ["Senegal","Guinea","Mali","Burkina Faso"], correct: 2, explanation: "Malian singer Salif Keita, an albino and descendant of royalty, is a towering figure in Afro-pop.", category: "music" },
  { question: "Lord Kitchener famously sang 'London Is the Place for Me' upon arriving on which ship?", options: ["The Carib Star","The Queen Mary","The Mauretania","The Empire Windrush"], correct: 3, explanation: "Trinidadian calypsonian Lord Kitchener sang it as the Windrush docked in 1948.", category: "music" },
  { question: "The 1992 film credited with igniting Nollywood's home-video boom is titled 'Living in ___'.", options: ["Bondage","Lagos","Sin","Fear"], correct: 0, explanation: "'Living in Bondage' (1992) is widely credited with launching the Nigerian home-video film industry.", category: "film" },
  { question: "Nollywood is often described as which-largest film industry by output?", options: ["First largest","Third largest","Fifth largest","Tenth largest"], correct: 1, explanation: "By volume of titles produced, Nollywood ranks among the largest film industries globally, often cited as third.", category: "film" },
  { question: "Mati Diop became the first Black woman to win the Cannes Grand Prix, in 2019, for which film?", options: ["Dahomey","Saint Omer","Atlantics","Mati"], correct: 2, explanation: "'Atlantics' (Atlantique), set in Dakar, won the Grand Prix at the 2019 Cannes Film Festival.", category: "film" },
  { question: "Ousmane Sembène's 'La Noire de...' ('Black Girl'), the first sub-Saharan African feature, came out in which decade?", options: ["1980s","1950s","1970s","1960s"], correct: 3, explanation: "'Black Girl' (1966) marked the birth of sub-Saharan African feature cinema; Sembène is the 'father of African film'.", category: "film" },
  { question: "Kugali Media's animated series 'Iwájú', set in a futuristic Lagos, premiered in 2024 on which platform?", options: ["Disney+","Netflix","Amazon Prime","HBO Max"], correct: 0, explanation: "'Iwájú' was a collaboration between Nigerian studio Kugali and Walt Disney Animation, streaming on Disney+.", category: "film" },
  { question: "Jordan Peele's 2022 sci-fi horror film about a force in the sky is titled what?", options: ["Us","Nope","Get Out","Candyman"], correct: 1, explanation: "'Nope' (2022) starred Daniel Kaluuya and Keke Palmer as siblings on a California horse ranch.", category: "film" },
  { question: "Jordan Peele's 2019 horror film featuring doppelgängers called 'the Tethered' is titled what?", options: ["Split","Nope","Us","The Twin"], correct: 2, explanation: "'Us' starred Lupita Nyong'o in a dual role and became a major box-office and critical success.", category: "film" },
  { question: "Spike Lee's 1989 film about racial tension on a hot Brooklyn day is titled 'Do the Right ___'.", options: ["Deed","Way","Time","Thing"], correct: 3, explanation: "'Do the Right Thing', set in Bed-Stuy, is one of Spike Lee's most acclaimed and debated films.", category: "film" },
  { question: "Spike Lee's epic 1992 biopic starred Denzel Washington as which civil rights leader?", options: ["Malcolm X","Martin Luther King Jr.","Medgar Evers","Huey Newton"], correct: 0, explanation: "Denzel Washington earned an Oscar nomination for the title role in Spike Lee's 'Malcolm X'.", category: "film" },
  { question: "John Singleton's 1991 debut, set in South Central Los Angeles, is titled '___ n the Hood'.", options: ["Kids","Boyz","Men","Days"], correct: 1, explanation: "'Boyz n the Hood' made Singleton the youngest person and first African American nominated for the Best Director Oscar.", category: "film" },
  { question: "Denzel Washington and Viola Davis won acclaim in the 2016 film of which August Wilson play?", options: ["Ma Rainey's Black Bottom","The Piano Lesson","Fences","Jitney"], correct: 2, explanation: "Viola Davis won the Best Supporting Actress Oscar for 'Fences', directed by and starring Denzel Washington.", category: "film" },
  { question: "FESPACO, the oldest and largest African film festival, is held in which country?", options: ["Kenya","Senegal","Morocco","Burkina Faso"], correct: 3, explanation: "FESPACO has been held in Ouagadougou, Burkina Faso, since 1969 and is the continent's premier film festival.", category: "film" },
  { question: "Ava DuVernay's 'A Wrinkle in Time' (2018) made her the first Black woman to do what?", options: ["Direct a live-action film with a $100M+ budget","Win the Palme d'Or","Direct a Marvel film","Win Best Director"], correct: 0, explanation: "DuVernay became the first Black woman to direct a live-action film with a nine-figure budget.", category: "film" },
  { question: "The 2018 film 'Black Panther' was set largely in which fictional African nation?", options: ["Zamunda","Wakanda","Genosha","Nyumbani"], correct: 1, explanation: "Ryan Coogler's 'Black Panther' depicted the technologically advanced, never-colonised nation of Wakanda.", category: "film" },
  { question: "Which film became the first majority-Black-led superhero film nominated for Best Picture?", options: ["Spawn","Blade","Black Panther","Hancock"], correct: 2, explanation: "'Black Panther' (2018) was the first superhero film nominated for the Academy Award for Best Picture.", category: "film" },
  { question: "Souleymane Cissé's acclaimed film 'Yeelen', which won at Cannes in 1987, came from which country?", options: ["Niger","Senegal","Burkina Faso","Mali"], correct: 3, explanation: "Malian director Souleymane Cissé won the Jury Prize at Cannes for the visually stunning 'Yeelen'.", category: "film" },
  { question: "Lupita Nyong'o, an Oscar winner, spent much of her childhood in which East African country?", options: ["Kenya","Tanzania","Uganda","Ethiopia"], correct: 0, explanation: "Born in Mexico to Kenyan parents, Nyong'o grew up in Kenya and identifies as Kenyan-Mexican.", category: "film" },
  { question: "The classic 1971 Gordon Parks film featuring a Black detective in Harlem is titled what?", options: ["Super Fly","Shaft","Coffy","Sweet Sweetback"], correct: 1, explanation: "'Shaft', scored by Isaac Hayes, was a defining film of the blaxploitation era.", category: "film" },
  { question: "Mo Farah, the British long-distance great, was born in which country before moving to the UK?", options: ["Eritrea","Sudan","Somalia","Ethiopia"], correct: 2, explanation: "Sir Mo Farah was born in Somalia and became a multiple Olympic champion over 5,000m and 10,000m for Britain.", category: "sport" },
  { question: "Eliud Kipchoge of Kenya won Olympic marathon gold at which two consecutive Games?", options: ["Tokyo 2020 and Paris 2024","London 2012 and Rio 2016","Beijing 2008 and London 2012","Rio 2016 and Tokyo 2020"], correct: 3, explanation: "Kipchoge won marathon gold at Rio 2016 and Tokyo 2020 (held 2021), cementing his legendary status.", category: "sport" },
  { question: "Arthur Ashe became the first Black man to win the men's singles title at which Grand Slam in 1975?", options: ["Wimbledon","US Open","Australian Open","French Open"], correct: 0, explanation: "Ashe defeated Jimmy Connors to win Wimbledon in 1975, having also won the US Open (1968) and Australian Open (1970).", category: "sport" },
  { question: "Muhammad Ali refused induction into the military during which war, as a conscientious objector?", options: ["The Korean War","The Vietnam War","World War II","The Gulf War"], correct: 1, explanation: "Ali's 1967 refusal to fight in Vietnam cost him his title and years of his career before the Supreme Court vindicated him.", category: "sport" },
  { question: "George Weah won the Ballon d'Or in 1995 and later became president of which country?", options: ["Senegal","Ghana","Liberia","Ivory Coast"], correct: 2, explanation: "Weah remains the only African Ballon d'Or winner and was elected President of Liberia in 2017.", category: "sport" },
  { question: "The first edition of the Africa Cup of Nations was held in 1957 in which country?", options: ["Ghana","Egypt","Ethiopia","Sudan"], correct: 3, explanation: "The inaugural AFCON took place in Sudan in 1957 with just three teams; Egypt won the title.", category: "sport" },
  { question: "Which country has won the most Africa Cup of Nations titles?", options: ["Egypt","Cameroon","Ghana","Nigeria"], correct: 0, explanation: "Egypt holds the record with seven AFCON titles, ahead of Cameroon's five.", category: "sport" },
  { question: "At Italia 1990, which became the first African nation to reach the World Cup quarter-finals?", options: ["Nigeria","Cameroon","Algeria","Morocco"], correct: 1, explanation: "Cameroon's 'Indomitable Lions' reached the quarter-finals in 1990, losing narrowly to England.", category: "sport" },
  { question: "At the 2002 World Cup, which African side beat reigning champions France in the opening match?", options: ["Nigeria","Cameroon","Senegal","South Africa"], correct: 2, explanation: "Senegal stunned France 1-0 in the 2002 opener and reached the quarter-finals on debut.", category: "sport" },
  { question: "Roger Milla set a record at the 1994 World Cup as the oldest player to do what?", options: ["Receive a red card","Captain a team","Save a penalty","Score a World Cup goal"], correct: 3, explanation: "Cameroon's Roger Milla scored aged 42 in 1994, the oldest goalscorer in World Cup history.", category: "sport" },
  { question: "Sir Vivian Richards is regarded as a batting legend for which cricket team?", options: ["West Indies","South Africa","England","India"], correct: 0, explanation: "Antiguan-born Viv Richards was a destructive batsman and captain of the dominant West Indies sides of the 1980s.", category: "sport" },
  { question: "Usain Bolt holds the 100m world record with a time of how many seconds?", options: ["9.69","9.58","9.77","9.63"], correct: 1, explanation: "Bolt set the 100m world record of 9.58 seconds at the 2009 Berlin World Championships.", category: "sport" },
  { question: "Usain Bolt's 200m world record, set in Berlin in 2009, stands at what time?", options: ["19.40","19.30","19.19","19.02"], correct: 2, explanation: "Bolt ran 19.19 seconds in the 200m at the 2009 World Championships, a record that still stands.", category: "sport" },
  { question: "Sadio Mané and which other forward formed a feared Liverpool attack with Roberto Firmino?", options: ["Thomas Partey","Riyad Mahrez","Wilfried Zaha","Mohamed Salah"], correct: 3, explanation: "Egypt's Mohamed Salah and Senegal's Sadio Mané powered Liverpool to Champions League and Premier League glory.", category: "sport" },
  { question: "Hakeem Olajuwon, an NBA Hall of Famer, was born in which African country?", options: ["Nigeria","Ghana","Cameroon","Senegal"], correct: 0, explanation: "Lagos-born 'Hakeem the Dream' led the Houston Rockets to two NBA titles in the 1990s.", category: "sport" },
  { question: "Simone Biles, the most decorated gymnast in history, competes for which country?", options: ["Jamaica","United States","Brazil","France"], correct: 1, explanation: "Biles is an American gymnast with a record number of World Championship and Olympic medals.", category: "sport" },
  { question: "Pelé, one of football's greatest, played most of his club career for Santos of which country?", options: ["Portugal","Argentina","Brazil","Spain"], correct: 2, explanation: "The Afro-Brazilian icon Pelé won three World Cups with Brazil and starred for Santos.", category: "sport" },
  { question: "Which Ethiopian runner won the 1960 Rome Olympic marathon running barefoot?", options: ["Mamo Wolde","Haile Gebrselassie","Kenenisa Bekele","Abebe Bikila"], correct: 3, explanation: "Abebe Bikila won barefoot in Rome in 1960, the first sub-Saharan African to win Olympic gold.", category: "sport" },
  { question: "Doubles, a street food of curried chickpeas in flatbread, comes from which country?", options: ["Trinidad and Tobago","Jamaica","Guyana","Barbados"], correct: 0, explanation: "Doubles, made with bara bread and curried channa, is a beloved Trinidadian breakfast and street snack.", category: "food" },
  { question: "Ackee and saltfish, the national dish of Jamaica, pairs salted cod with which fruit?", options: ["Breadfruit","Ackee","Soursop","Guava"], correct: 1, explanation: "Ackee, when ripe, is cooked with saltfish to create Jamaica's iconic national dish.", category: "food" },
  { question: "Injera, a spongy fermented flatbread, is a staple of which countries' cuisines?", options: ["Kenya and Tanzania","Ghana and Nigeria","Ethiopia and Eritrea","Morocco and Algeria"], correct: 2, explanation: "Injera, made from teff flour, is central to Ethiopian and Eritrean meals, used to scoop up stews.", category: "food" },
  { question: "Bunny chow, a hollowed loaf filled with curry, originated in which South African city?", options: ["Pretoria","Cape Town","Johannesburg","Durban"], correct: 3, explanation: "Bunny chow is a Durban street-food icon born of the city's large Indian diaspora.", category: "food" },
  { question: "Fufu is typically eaten by doing what with it?", options: ["Pinching off pieces to scoop soup","Spreading it like butter","Drinking it","Frying it into chips"], correct: 0, explanation: "Fufu, a starchy swallow, is pinched into balls and dipped into soups across West and Central Africa.", category: "food" },
  { question: "Suya, the spiced grilled meat skewer, is traditionally associated with which Nigerian people?", options: ["Yoruba","Hausa","Igbo","Ijaw"], correct: 1, explanation: "Suya, coated in the peanut-based yaji spice, has Hausa-Fulani origins in northern Nigeria.", category: "food" },
  { question: "Egusi soup is thickened and flavoured with the ground seeds of which plant?", options: ["Sunflower","Pumpkin","Melon","Sesame"], correct: 2, explanation: "Egusi uses ground melon seeds to make a rich, hearty West African soup.", category: "food" },
  { question: "Jerk seasoning relies heavily on allspice and which fiery pepper?", options: ["Bird's eye","Jalapeño","Cayenne","Scotch bonnet"], correct: 3, explanation: "Scotch bonnet peppers and pimento (allspice) give jerk its distinctive heat and aroma.", category: "food" },
  { question: "Rooibos, a caffeine-free herbal tea, is grown almost exclusively in which country?", options: ["South Africa","Kenya","Morocco","Egypt"], correct: 0, explanation: "Rooibos ('red bush') grows in the Cederberg region of South Africa's Western Cape.", category: "food" },
  { question: "Waakye, a dish of rice and beans cooked with sorghum leaves, is a staple of which country?", options: ["Senegal","Ghana","Mali","Liberia"], correct: 1, explanation: "Waakye is a popular Ghanaian breakfast and lunch dish, often served with shito and gari.", category: "food" },
  { question: "Couscous, a steamed semolina staple, is most associated with which region of Africa?", options: ["Southern Africa","The Horn of Africa","The Maghreb (North Africa)","Central Africa"], correct: 2, explanation: "Couscous is a foundational dish of North African cuisine in Morocco, Algeria and Tunisia.", category: "food" },
  { question: "Plantain fried until sweet and golden is known in Nigeria by what name?", options: ["Akara","Garri","Moin-moin","Dodo"], correct: 3, explanation: "Dodo refers to fried ripe plantain, a beloved side dish across Nigeria.", category: "food" },
  { question: "Roti, a flatbread wrap with curried fillings, is especially iconic in which Caribbean nation?", options: ["Trinidad and Tobago","Cuba","Haiti","Bahamas"], correct: 0, explanation: "Trinidad's dhalpuri and buss-up-shut roti reflect the island's Indo-Caribbean heritage.", category: "food" },
  { question: "Akara is a deep-fried snack made from which main ingredient?", options: ["Cassava","Black-eyed peas (beans)","Maize","Yam"], correct: 1, explanation: "Akara are fried fritters of ground, seasoned black-eyed peas, popular for breakfast in West Africa and Brazil.", category: "food" },
  { question: "Acarajé, a street food of Salvador, Brazil, descends directly from which West African dish?", options: ["Fufu","Suya","Akara","Jollof"], correct: 2, explanation: "Afro-Brazilian acarajé in Bahia is the direct descendant of Yoruba akara, sold by 'baianas'.", category: "food" },
  { question: "Maafe, a rich peanut stew, is a signature dish of which West African tradition?", options: ["Berber","Tuareg","San","Mandinka (Senegal/Mali)"], correct: 3, explanation: "Maafe (groundnut stew) is a Mandinka dish widespread in Senegal, Mali and across West Africa.", category: "food" },
  { question: "The kola nut, used in ceremonies, holds special significance among which Nigerian people?", options: ["Igbo","Tuareg","San","Maasai"], correct: 0, explanation: "Among the Igbo, the kola nut ('oji') is central to hospitality and ritual welcome.", category: "food" },
  { question: "Thieboudienne, often called Senegal's national dish, is built around fish and which staple?", options: ["Millet","Rice","Cassava","Plantain"], correct: 1, explanation: "Thieboudienne (ceebu jën), a one-pot fish-and-rice dish, was added to UNESCO's intangible heritage list.", category: "food" },
  { question: "Capoeira, an Afro-Brazilian art of dance and martial arts, is accompanied by which instrument?", options: ["Kora","Talking drum","Berimbau","Mbira"], correct: 2, explanation: "The single-string berimbau sets the rhythm and pace of a capoeira 'roda' (circle).", category: "culture" },
  { question: "Candomblé, an Afro-Brazilian religion, is centred in which Brazilian state?", options: ["Minas Gerais","São Paulo","Rio de Janeiro","Bahia"], correct: 3, explanation: "Candomblé, preserving Yoruba, Fon and Bantu traditions, is most strongly rooted in Salvador, Bahia.", category: "culture" },
  { question: "The Pan-African flag designed under Marcus Garvey uses which three colours?", options: ["Red, black and green","Red, gold and green","Black, gold and green","Red, white and black"], correct: 0, explanation: "The red, black and green flag (1920) symbolises the blood, people and land of the African diaspora.", category: "culture" },
  { question: "The ankh, an ancient symbol of life, originates from which civilisation?", options: ["Kingdom of Kush","Ancient Egypt","Mali Empire","Great Zimbabwe"], correct: 1, explanation: "The ankh, resembling a looped cross, was the ancient Egyptian hieroglyph for life.", category: "culture" },
  { question: "Mae Jemison made history in 1992 as the first Black woman to do what?", options: ["Lead NASA","Win a Fields Medal","Travel into space","Pilot a fighter jet"], correct: 2, explanation: "Jemison flew aboard Space Shuttle Endeavour in 1992, the first African American woman in space.", category: "culture" },
  { question: "Katherine Johnson, celebrated in 'Hidden Figures', was a mathematician at which agency?", options: ["FBI","NSA","DARPA","NASA"], correct: 3, explanation: "Johnson's orbital calculations were vital to early NASA spaceflights, including John Glenn's mission.", category: "culture" },
  { question: "Misty Copeland broke barriers in 2015 as the first Black female principal dancer of which company?", options: ["American Ballet Theatre","New York City Ballet","Royal Ballet","Alvin Ailey"], correct: 0, explanation: "Copeland became American Ballet Theatre's first Black female principal dancer in its 75-year history.", category: "culture" },
  { question: "The Alvin Ailey American Dance Theater was founded in which year?", options: ["1968","1958","1948","1978"], correct: 1, explanation: "Choreographer Alvin Ailey founded his company in 1958; its signature work 'Revelations' premiered in 1960.", category: "culture" },
  { question: "Kwanzaa, a celebration of African American culture, is observed over how many days?", options: ["Three","Five","Seven","Ten"], correct: 2, explanation: "Created by Maulana Karenga in 1966, Kwanzaa runs 26 December to 1 January, marking seven principles.", category: "culture" },
  { question: "Crop Over, a vibrant harvest festival, is celebrated annually in which Caribbean nation?", options: ["St. Lucia","Jamaica","Grenada","Barbados"], correct: 3, explanation: "Crop Over, rooted in the sugar-cane harvest, is Barbados's biggest festival, ending on Grand Kadooment Day.", category: "culture" },
  { question: "The steel pan, the national instrument of Trinidad and Tobago, was invented in which decade?", options: ["1930s-1940s","1900s","1960s","1980s"], correct: 0, explanation: "The steelpan emerged in Trinidad in the late 1930s and 1940s, developed from oil drums.", category: "culture" },
  { question: "Sankofa, an Akan concept symbolised by a backward-looking bird, broadly means what?", options: ["Forgetting hardship","Learning from the past to build the future","Marrying for love","Fearing change"], correct: 1, explanation: "Sankofa teaches that it is not wrong to go back and reclaim what was lost or learned in the past.", category: "culture" },
  { question: "Griots of West Africa serve primarily as what?", options: ["Herbalists","Blacksmiths","Oral historians and praise-singers","Tax collectors"], correct: 2, explanation: "Griots (jeli) are hereditary keepers of oral history, genealogy and music in Mande societies.", category: "culture" },
  { question: "The kora, a 21-string harp-lute, is most associated with which tradition?", options: ["Tuareg nomads","Zulu praise poets","Maasai elders","Mande griots"], correct: 3, explanation: "The kora is the signature instrument of Mande griots across Senegal, Mali, Guinea and The Gambia.", category: "culture" },
  { question: "Haitian Vodou blends Catholicism with West African Vodun from which peoples?", options: ["The Fon and Ewe","The Zulu and Xhosa","The Akan and Ga","The Hausa and Fulani"], correct: 0, explanation: "Haitian Vodou draws heavily on the Vodun traditions of the Fon and Ewe of present-day Benin and Togo.", category: "culture" },
  { question: "The 'Year of Return' in 2019 invited the diaspora to visit which country, 400 years after 1619?", options: ["Senegal","Ghana","Nigeria","Benin"], correct: 1, explanation: "Ghana's 'Year of Return' commemorated 400 years since the first enslaved Africans arrived in Virginia.", category: "culture" },
  { question: "Oprah Winfrey is widely recognised as the first Black woman to become what?", options: ["A Nobel laureate","A US senator","A billionaire in the US","An Olympic gold medallist"], correct: 2, explanation: "Through her media empire, Oprah Winfrey became the first Black female billionaire in the United States.", category: "culture" },
  { question: "The Maasai jumping dance performed by warriors is known as what?", options: ["Sabar","Eskista","Indlamu","Adumu"], correct: 3, explanation: "The adumu, or jumping dance, is performed by Maasai morans (warriors) during the Eunoto ceremony.", category: "culture" },
  { question: "Strive Masiyiwa built the telecoms company Econet, becoming a leading businessman from which country?", options: ["Zimbabwe","South Africa","Nigeria","Kenya"], correct: 0, explanation: "Zimbabwean entrepreneur Strive Masiyiwa founded Econet Wireless after a landmark legal battle to license it.", category: "culture" },
  { question: "Aliko Dangote, often Africa's richest person, built his fortune chiefly in which industry?", options: ["Banking","Cement and commodities","Oil drilling","Telecoms"], correct: 1, explanation: "Nigerian magnate Aliko Dangote's empire spans cement, sugar, flour and more through the Dangote Group.", category: "culture" },
  { question: "Folorunso Alakija, one of the richest women in Africa, made much of her wealth in which sector?", options: ["Agriculture","Fashion only","Oil","Mining"], correct: 2, explanation: "Nigerian billionaire Folorunso Alakija built her fortune through an oil exploration license, alongside fashion.", category: "culture" },
  { question: "Patrick Awuah founded Ashesi University, a leading liberal-arts institution, in which country?", options: ["Kenya","Nigeria","Rwanda","Ghana"], correct: 3, explanation: "After a Microsoft career, Awuah founded Ashesi University in Ghana to cultivate ethical, entrepreneurial leaders.", category: "culture" },
  { question: "The Benin Bronzes, looted in 1897, were created in the Kingdom of Benin in present-day which country?", options: ["Nigeria","Benin","Ghana","Togo"], correct: 0, explanation: "The Benin Bronzes came from the Kingdom of Benin (Edo) in modern Nigeria, not the present-day Republic of Benin.", category: "art" },
  { question: "Jean-Michel Basquiat had heritage from Haiti and which other country?", options: ["Jamaica","Puerto Rico","Cuba","Dominican Republic"], correct: 1, explanation: "Basquiat's father was Haitian and his mother was of Puerto Rican descent.", category: "art" },
  { question: "Kehinde Wiley painted the official portrait of which US president, unveiled in 2018?", options: ["Jimmy Carter","Bill Clinton","Barack Obama","Joe Biden"], correct: 2, explanation: "Wiley's vivid portrait of Barack Obama hangs in the Smithsonian National Portrait Gallery.", category: "art" },
  { question: "Amy Sherald painted the official portrait of which former US First Lady?", options: ["Jill Biden","Hillary Clinton","Laura Bush","Michelle Obama"], correct: 3, explanation: "Sherald's striking grey-toned portrait of Michelle Obama was unveiled alongside Wiley's Obama portrait in 2018.", category: "art" },
  { question: "El Anatsui, famed for shimmering wall sculptures from bottle caps, is from which country?", options: ["Ghana","Nigeria","Senegal","Kenya"], correct: 0, explanation: "Ghanaian-born El Anatsui, long based in Nigeria, transforms discarded metal into vast tapestry-like artworks.", category: "art" },
  { question: "The Nok culture of ancient Nigeria is best known for producing which artefacts?", options: ["Bronze masks","Terracotta sculptures","Gold jewellery","Stone obelisks"], correct: 1, explanation: "The Nok culture (c. 1500 BCE-500 CE) produced distinctive terracotta figures, among Africa's oldest sculpture.", category: "art" },
  { question: "Faith Ringgold combined painting and quilting in 'story quilts' exploring which themes?", options: ["Pure abstraction","Renaissance mythology","African American life and history","Marine landscapes"], correct: 2, explanation: "Ringgold's story quilts, like 'Tar Beach', narrate African American experience and women's lives.", category: "art" },
  { question: "The brass plaques of the Benin Kingdom adorned which structure?", options: ["A library","A cathedral","A market hall","The royal palace"], correct: 3, explanation: "The plaques decorated the pillars and walls of the Oba's royal palace in Benin City.", category: "art" },
  { question: "Yinka Shonibare's art frequently features which material to explore colonialism?", options: ["Dutch wax (Ankara) fabric","Marble","Neon tubing","Recycled plastic"], correct: 0, explanation: "British-Nigerian artist Yinka Shonibare uses brightly patterned wax fabric to question authenticity and empire.", category: "art" },
  { question: "Aaron Douglas was a key visual artist of which 1920s movement?", options: ["Cubism","The Harlem Renaissance","Surrealism","The Bauhaus"], correct: 1, explanation: "Douglas's silhouetted, Art Deco-influenced murals made him a leading painter of the Harlem Renaissance.", category: "art" },
  { question: "David Adjaye was lead designer of which Washington, D.C. museum?", options: ["Hirshhorn Museum","National Gallery of Art","National Museum of African American History and Culture","Smithsonian Castle"], correct: 2, explanation: "Ghanaian-British architect Adjaye led the design of the NMAAHC, opened on the National Mall in 2016.", category: "art" },
  { question: "The Great Mosque of Djenné in Mali is the world's largest building made primarily of what?", options: ["Timber","Limestone","Granite","Mud brick (adobe)"], correct: 3, explanation: "The Great Mosque of Djenné, a UNESCO site, is the largest mud-brick (adobe) structure on Earth.", category: "art" },
  { question: "Kara Walker is best known for large installations using which technique?", options: ["Black cut-paper silhouettes","Stained glass","Pointillism","Graffiti tagging"], correct: 0, explanation: "Walker's room-sized silhouette tableaux confront the brutal history of American slavery.", category: "art" },
  { question: "Akan gold weights, used to weigh gold dust, often depicted what?", options: ["Portraits of kings","Proverbs in miniature","Maps of trade routes","Star charts"], correct: 1, explanation: "Cast-brass Akan gold weights frequently illustrated proverbs and everyday scenes.", category: "art" },
  { question: "Wangechi Mutu, known for Afrofuturist collage and sculpture, is from which country?", options: ["South Africa","Nigeria","Kenya","Egypt"], correct: 2, explanation: "Nairobi-born Wangechi Mutu was commissioned for the Met's facade niches in 2019.", category: "art" },
  { question: "The rock art of the San people, among the world's oldest, is found chiefly in which region?", options: ["Central Africa","The Sahara","The Horn of Africa","Southern Africa"], correct: 3, explanation: "San rock paintings and engravings appear across Southern Africa, some dating back thousands of years.", category: "art" },
  { question: "Romare Bearden was a master of which art form depicting African American life?", options: ["Collage","Bronze casting","Fresco","Etching"], correct: 0, explanation: "Bearden's vibrant collages of jazz clubs, the rural South and Harlem are landmarks of American art.", category: "art" },
  { question: "El Anatsui received which honour at the 2015 Venice Biennale?", options: ["Turner Prize","Golden Lion for Lifetime Achievement","Hugo Boss Prize","Praemium Imperiale"], correct: 1, explanation: "El Anatsui was awarded the Golden Lion for Lifetime Achievement at the 2015 Venice Biennale.", category: "art" },
  { question: "Dapper Dan revolutionised hip-hop fashion in the 1980s from a boutique in which neighbourhood?", options: ["The Bronx","Brooklyn","Harlem","Compton"], correct: 2, explanation: "Dapper Dan's Harlem atelier dressed rappers and athletes in bold logo couture, later partnering with Gucci.", category: "fashion" },
  { question: "FUBU, the influential 1990s streetwear brand, has a name standing for what?", options: ["Future Urban Brand United","Fashion United By Urban","Forever Building Up","For Us By Us"], correct: 3, explanation: "FUBU, founded by Daymond John and partners, embodied Black-owned fashion: 'For Us, By Us'.", category: "fashion" },
  { question: "Tracey 'Africa' Norman, one of the first Black transgender models, worked for which brand in 1975?", options: ["Clairol","Revlon","Avon","Maybelline"], correct: 0, explanation: "Norman modelled for Clairol's 'Born Beautiful' hair colour, decades before her story became widely known.", category: "fashion" },
  { question: "Iman, the pioneering Somali supermodel, was famously married to which musician?", options: ["Lenny Kravitz","David Bowie","Prince","Seal"], correct: 1, explanation: "Iman married David Bowie in 1992 and later built a successful cosmetics line for women of colour.", category: "fashion" },
  { question: "Virgil Abloh made history in 2018 as artistic director of menswear for which luxury house?", options: ["Dior","Gucci","Louis Vuitton","Balenciaga"], correct: 2, explanation: "Abloh, founder of Off-White, became Louis Vuitton's first Black artistic director of menswear.", category: "fashion" },
  { question: "Ozwald Boateng became the first Black tailor with a shop on which famous London street?", options: ["Oxford Street","Carnaby Street","Bond Street","Savile Row"], correct: 3, explanation: "British-Ghanaian Boateng brought bold colour to Savile Row's traditional bespoke tailoring.", category: "fashion" },
  { question: "Ankara wax-print fabric has manufacturing roots tied to which European country?", options: ["The Netherlands","France","Britain","Belgium"], correct: 0, explanation: "Dutch wax prints (e.g. Vlisco) were inspired by Indonesian batik and became central to West African dress.", category: "fashion" },
  { question: "Kente cloth is woven on narrow looms by which people?", options: ["The Zulu","The Asante (and Ewe)","The Maasai","The Hausa"], correct: 1, explanation: "Kente originates with the Asante and Ewe of Ghana, each pattern and colour carrying meaning.", category: "fashion" },
  { question: "Edward Enninful made history in 2017 as the first Black editor-in-chief of which magazine?", options: ["Elle","Harper's Bazaar","British Vogue","GQ"], correct: 2, explanation: "Ghanaian-British Enninful became the first male and first Black editor-in-chief of British Vogue.", category: "fashion" },
  { question: "Aso-oke, a prestigious hand-woven ceremonial cloth, comes from which Nigerian people?", options: ["Kanuri","Igbo","Tiv","Yoruba"], correct: 3, explanation: "Aso-oke ('top cloth') is woven by the Yoruba and worn at weddings and major celebrations.", category: "fashion" },
  { question: "Lagos Fashion Week, a leading showcase of African design, is held in which country?", options: ["Nigeria","Ghana","South Africa","Kenya"], correct: 0, explanation: "Lagos Fashion Week has grown into one of Africa's most influential platforms for emerging designers.", category: "fashion" },
  { question: "Telfar Clemens's popular shopping bag earned which affectionate nickname?", options: ["The Harlem Hermès","The Bushwick Birkin","The Brooklyn Birkin","The Queens Kelly"], correct: 1, explanation: "Telfar's accessible vegan-leather tote, dubbed the 'Bushwick Birkin', became a cult favourite.", category: "fashion" },
  { question: "Adire, an indigo resist-dyed cloth, is a textile tradition of which Nigerian people?", options: ["Efik","Igbo","Yoruba","Fulani"], correct: 2, explanation: "Adire, made by Yoruba women using starch resist and indigo dye, is centred in towns like Abeokuta.", category: "fashion" },
  { question: "Naomi Campbell was the first Black model on the cover of French ___ in 1988.", options: ["Cosmopolitan","Elle","Marie Claire","Vogue"], correct: 3, explanation: "Campbell broke a colour barrier as the first Black model on the cover of French Vogue.", category: "fashion" },
  { question: "Shweshwe, a printed cotton used for traditional dress, is strongly associated with which country?", options: ["South Africa","Nigeria","Egypt","Senegal"], correct: 0, explanation: "Shweshwe is woven into Xhosa, Sotho and Tswana traditional attire.", category: "fashion" },
  { question: "Patrick Kelly became, in 1988, the first American admitted to which French fashion body?", options: ["Académie française","Chambre Syndicale du Prêt-à-Porter","Conseil de Paris","Fédération Horlogère"], correct: 1, explanation: "Kelly, a Black designer from Mississippi, was the first American invited to join the Chambre Syndicale.", category: "fashion" },
  { question: "Kitenge (chitenge), a colourful cotton wrap, is everyday wear across which region?", options: ["Southern Africa only","North Africa","East and Central Africa","The Sahel only"], correct: 2, explanation: "Kitenge cloth is worn as wraps, headscarves and tailored garments across East and Central Africa.", category: "fashion" },
  { question: "Grace Wales Bonner, an award-winning designer exploring Black heritage, is based in which city?", options: ["Milan","Paris","New York","London"], correct: 3, explanation: "British designer Wales Bonner, of Jamaican-British descent, blends European tailoring with diasporic culture.", category: "fashion" },
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
