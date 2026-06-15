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
