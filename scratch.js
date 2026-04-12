async function test() {
  const query = `
    query GetFilters {
      categories(where: { hideEmpty: true, orderby: COUNT, order: DESC }, first: 100) { nodes { name, slug } }
      industries(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
      countries(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
      series(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
    }
  `;
  const res = await fetch("https://cms.themoveee.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  const json = await res.json();
  console.log(JSON.stringify(json.data.series, null, 2));
}
test();
