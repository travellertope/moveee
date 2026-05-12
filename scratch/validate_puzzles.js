
const PUZZLES = [
  {
    title: "Roots & Rhythms",
    grid: [
      "FELA.U.",
      "U.KENTE",
      "J.E...B",
      "I.GRIOT",
      ".LAGOS.",
      "..O...T",
      "..ORISA",
    ],
    clues: [
      { direction: "across", answer: "FELA",  clue: "Pioneer of Afrobeat, ___ Kuti" },
      { direction: "across", answer: "KENTE", clue: "Colourful Ghanaian woven cloth" },
      { direction: "across", answer: "GRIOT", clue: "West African storyteller and oral historian" },
      { direction: "across", answer: "LAGOS", clue: "Nigeria's largest city and cultural capital" },
      { direction: "across", answer: "ORISA", clue: "Yoruba deity or spirit (also Orisha)" },
      { direction: "down",   answer: "FUJI",  clue: "Nigerian music genre pioneered by Sikiru Ayinde Barrister" },
      { direction: "down",   answer: "UBUNTU",clue: '"I am because we are" — African philosophy' },
      { direction: "down",   answer: "EGO",   clue: "___béatrice (Ivorian author) or self" },
    ],
  },
  {
    title: "Pan-African Pulse",
    grid: [
      "ACCRA.J",
      "F.CAIRO",
      "R.I...L",
      "O.NAIJA",
      ".SHEA.O",
      "..O...F",
      "..ADIRE",
    ],
    clues: [
      { direction: "across", answer: "ACCRA",  clue: "Capital city of Ghana" },
      { direction: "across", answer: "CAIRO",  clue: "Capital of Egypt, home of Al-Azhar" },
      { direction: "across", answer: "NAIJA",  clue: "Affectionate slang for Nigeria" },
      { direction: "across", answer: "SHEA",   clue: "___ butter — skin staple from West Africa" },
      { direction: "across", answer: "ADIRE",  clue: "Yoruba indigo tie-dye textile tradition" },
      { direction: "down",   answer: "AFRO",   clue: "Natural hair style and cultural statement" },
      { direction: "down",   answer: "NAIROBI",clue: "Capital of Kenya" },
      { direction: "down",   answer: "JOLLOF", clue: "The rice dish that unites West Africa" },
    ],
  },
  {
    title: "Diaspora Voices",
    grid: [
      "GHANA.K",
      "R.B.A.O",
      "I.A.B.L",
      "O.T.I.A",
      "T.I.D..",
      "..K.J..",
      "..BONGO",
    ],
    clues: [
      { direction: "across", answer: "GHANA",  clue: "First sub-Saharan country to gain independence (1957)" },
      { direction: "across", answer: "BONGO",  clue: "Paired hand drums originating in Cuba, with African roots" },
      // Added new ones or removed broken ones?
      // Let's keep the user's clues but fix the grid.
      { direction: "across", answer: "BATIK",  clue: "Wax-resist fabric dyeing technique widespread in Africa" },
      { direction: "across", answer: "NILE",   clue: "World's longest river, flowing through East Africa" },
      { direction: "across", answer: "TUNIS",  clue: "Capital of Tunisia on the North African coast" },
      { direction: "down",   answer: "GRIOT",  clue: "West African keeper of oral history and music" },
      { direction: "down",   answer: "ABIDJAN",clue: "Economic capital of Côte d'Ivoire" },
      { direction: "down",   answer: "KOLA",   clue: "___ nut — ceremonial seed used in West African tradition" },
    ],
  },
];

function validate(puzzle) {
  const size = puzzle.grid.length;
  const grid = puzzle.grid;
  console.log(`\nValidating: ${puzzle.title}`);
  
  puzzle.clues.forEach(clue => {
    const word = clue.answer;
    let found = false;
    
    // Search Across
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= grid[r].length - word.length; c++) {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (grid[r][c+i] !== word[i]) { match = false; break; }
        }
        if (match) {
          const startBound = (c === 0 || grid[r][c-1] === ".");
          const endBound = (c + word.length === grid[r].length || grid[r][c+word.length] === ".");
          if (startBound && endBound) found = true;
        }
      }
    }
    
    // Search Down
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r <= size - word.length; r++) {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (!grid[r+i] || grid[r+i][c] !== word[i]) { match = false; break; }
        }
        if (match) {
          const startBound = (r === 0 || grid[r-1][c] === ".");
          const endBound = (r + word.length === size || grid[r+word.length][c] === ".");
          if (startBound && endBound) found = true;
        }
      }
    }
    
    if (!found) {
      console.log(`  [MISSING] ${clue.direction.toUpperCase()} ${clue.answer}`);
    } else {
       console.log(`  [OK] ${clue.direction.toUpperCase()} ${clue.answer}`);
    }
  });
}

PUZZLES.forEach(validate);
