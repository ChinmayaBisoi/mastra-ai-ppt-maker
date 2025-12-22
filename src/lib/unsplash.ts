// @ts-ignore - unsplash-js package may not have types
import { createApi } from "unsplash-js";

export const unsplash = createApi({
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!,
  fetch: fetch,
});
