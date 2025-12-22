// @ts-expect-error - replicate package may not have types
import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
