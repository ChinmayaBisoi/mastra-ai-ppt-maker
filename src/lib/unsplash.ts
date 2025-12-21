// Unsplash is optional - only used if NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is set
// @ts-ignore - unsplash-js package may not be installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApi } = require("unsplash-js");

export const unsplash = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  ? createApi({
      accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
      fetch: fetch,
    })
  : null;
