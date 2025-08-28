
import { z } from "zod";

export const recommendationsSchema = z.object({
  preferences: z.string().min(10, {
    message: "Please describe your preferences in at least 10 characters.",
  }),
  browsingHistory: z.string().optional(),
});
