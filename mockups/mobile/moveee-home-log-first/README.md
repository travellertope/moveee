# Moveee Home — Log-First (Artifact Design canvas)

Four 390x844 boards for the log-first home and the quote -> directory linkage:

| File | Board |
|---|---|
| `Main.dc.html` | Home — the log (capture bar, In Progress, Year in Culture, feed) |
| `Book.dc.html` | Book entry — "Lines saved from this", each line attributed to who said it |
| `Person.dc.html` | Person entry — "Lines people saved", unioned across every source, plus the save-a-line composer |
| `Entry.dc.html` | Place entry — same template where saved lines don't apply |
| `canvas.json` | Board index (positions, titles, sticky notes) |

**These are not standalone HTML files** — unlike every other file in `mockups/`, they are an
Artifact Design canvas export. Each board loads `./support.js` and uses `<sc-if>`/`<sc-for>` plus a
`class Component extends DCLogic` block, all of which come from the Artifact type's runtime, not from
this folder. Opening one directly in a browser renders nothing. To view or edit them, publish the
folder to an Artifact Design canvas; `canvas.json` is the entry point.

What the two entry boards demonstrate, and why they differ, is the shipped per-entry-type rule from
`Culture_Directory::quotes_for_directory_entry()` — a person's page shows each line's **source**, a
work's page shows its **author**. The composer on `Person.dc.html` mirrors `QUOTE_SOURCE_TYPES`:
Book/Film/Song get a real directory picker, Talk falls back to freeform text because there is no
entry type for one.

Line text is deliberately bracketed placeholder copy. Do not replace it with invented sentences
attributed to a living writer.
