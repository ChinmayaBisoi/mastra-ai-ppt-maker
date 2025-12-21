// Replicate is optional - only used if REPLICATE_API_TOKEN is set
// @ts-ignore - replicate package may not be installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Replicate = require("replicate");

export const replicate = process.env.REPLICATE_API_TOKEN
  ? new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  : null;
