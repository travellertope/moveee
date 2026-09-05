import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";

import { Media } from "./collections/Media";
import { Authors } from "./collections/Authors";
import { Categories, Industries, Series, Countries } from "./collections/taxonomies";
import { Articles } from "./collections/Articles";
import { Newsletters } from "./collections/Newsletters";
import { Quotes } from "./collections/Quotes";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  // Payload requires a Users collection for admin auth — kept separate
  // from Moveee's own member accounts (those stay in WordPress/whatever
  // replaces it), this is CMS-editor login only.
  admin: {
    user: "users",
  },
  editor: lexicalEditor(),
  collections: [
    { slug: "users", auth: true, fields: [] },
    Media,
    Authors,
    Categories,
    Industries,
    Series,
    Countries,
    Articles,
    Newsletters,
    Quotes,
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  // Reuses the same Cloudflare R2 bucket class-culture-r2.php already
  // uploads to (see CLAUDE.md "Mobile image uploads → Cloudflare R2") —
  // media stays in one place across both the old and new backend during
  // the migration window, no bulk asset copy needed.
  plugins: [
    s3Storage({
      collections: { media: true },
      bucket: process.env.R2_BUCKET_NAME || "moveee-media",
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: "auto",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
      },
    }),
  ],
});
