
"use server";

import { personalizedRecommendations } from "@/ai/flows/personalized-recommendations";
import type { PersonalizedRecommendationsOutput } from "@/ai/flows/personalized-recommendations";
import { recommendationsSchema } from "./schema";

export type State = {
  message?: string | null;
  errors?: {
    preferences?: string[];
    browsingHistory?: string[];
    server?: string[];
  };
  data?: PersonalizedRecommendationsOutput | null;
};

export async function getPersonalizedRecommendations(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = recommendationsSchema.safeParse({
    preferences: formData.get("preferences"),
    browsingHistory: formData.get("browsingHistory"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check the form.",
    };
  }
  
  const { preferences, browsingHistory } = validatedFields.data;

  try {
    const historyArray = browsingHistory
      ? browsingHistory.split("\n").filter((item) => item.trim() !== "")
      : [];

    const result = await personalizedRecommendations({
      userId: "user-123", // Using a mock user ID
      preferences: preferences,
      browsingHistory: historyArray,
    });

    return {
      message: "Here are your personalized recommendations!",
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An unexpected error occurred.",
      errors: {
        server: ["Failed to get recommendations. Please try again later."],
      },
    };
  }
}
