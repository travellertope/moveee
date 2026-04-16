const WP_GRAPHQL_URL = "https://cms.themoveee.com/graphql";

async function testGraphQL() {
  const query = `
    query TestQuery {
      cultureEvents(first: 5) {
        nodes {
          id
          title
          slug
        }
      }
    }
  `;

  try {
    const res = await fetch(WP_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();
    console.log("Response Status:", res.status);
    if (json.errors) {
      console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
    } else {
      console.log("Success! Events found:", json.data.cultureEvents.nodes.length);
      console.log(JSON.stringify(json.data.cultureEvents.nodes, null, 2));
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testGraphQL();
