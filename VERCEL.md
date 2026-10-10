# Vercel deployment

Import `agusain2001/L_JK` into Vercel, use the Next.js framework, and leave Root Directory at the repository root. The checked-in `vercel.json` runs the deployment build automatically.

## Required services and environment variables

Connect a PostgreSQL database (for example Neon from the project's Storage tab) and a **Private** Vercel Blob store. S3 is also supported instead of Blob. Use separate databases and storage for Preview and Production if previews should be enabled; never point untrusted preview deployments at production data.

Set these in the project's Production environment:

| Variable | Value |
| --- | --- |
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_URL` | The PostgreSQL connection URL from your database provider |
| `BETTER_AUTH_SECRET` | A randomly generated secret of at least 32 characters |
| `BETTER_AUTH_URL` | Your site's exact public HTTPS origin |
| `BLOB_READ_WRITE_TOKEN` | Set automatically when the private Blob store is connected; alternatively use `BLOB_STORE_ID` with Vercel OIDC |
| `ADMIN_SECRET` | Optional owner password of at least 24 characters; admin stays disabled until set |

Secrets belong in Vercel environment settings, never Git or chat. Connecting a cloud service does not copy the local database or existing uploaded media. Migrate the local content deliberately before replacing it with a fresh database. Existing files under `.data/uploads` map to `for-you/uploads/<filename>` in private storage; files under `.data/world-media` map to `for-you/<filename>`. The generated demo chime does not need uploading. Playground configuration from `.data/games.json` can be saved through the admin editor after migration.

The build generates the PostgreSQL Prisma client, applies the included PostgreSQL migrations, and builds Next.js. Gallery photos and world attachments use private Blob or S3, with the same approval and audience checks before delivery. Playground edits persist in PostgreSQL. SQLite and local uploads remain available for local development.

## Platform limits and validation

The current upload routes accept server-side multipart uploads. Vercel Functions impose a 4.5 MB request/response limit, so use uploads smaller than 4 MB on Vercel. Larger audio files need a future authenticated direct-upload and streaming flow. The local host still accepts up to 20 MB.

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:storage`, and the storage-related browser tests before deployment. Verify the deployed homepage, `/world`, sign-in, admin access, upload approval, private-media denial for guests, and persistence across a redeployment. A local build does not verify a live PostgreSQL or Blob connection.

References: [Vercel Storage](https://vercel.com/docs/storage), [Private Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk), [Function limits](https://vercel.com/docs/functions/limitations).
