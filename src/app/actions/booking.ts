// src/app/actions/booking.ts
"use server";

import { z } from "zod";

const bookingSchema = z.object({
  fullName: z.string().min(3, { message: "Please enter a valid full name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  location: z.string().min(3, { message: "Please enter a valid location." }),
  propertyType: z.enum(["residential", "commercial", "office", "hospitality", "other"]),
  spaceToBeDesigned: z.string().min(3, { message: "Please specify the space." }),
  size: z.string().min(2, { message: "Please provide an approximate size." }),
  status: z.enum(["new build", "renovation", "furnishing only", "consultation"]),
  style: z.string().min(3, { message: "Please describe your preferred style." }),
  budget: z.string().min(3, { message: "Please provide a budget range." }),
  completionDate: z.string().optional(),
  servicesRequired: z.enum(["consultation only", "full design", "furniture sourcing", "decor and styling"]),
  preferredDate: z.string({ required_error: "Please select a preferred consultation date." }),
});


export type BookingState = {
  message?: string | null;
  errors?: {
    fullName?: string[];
    email?: string[];
    phone?: string[];
    location?: string[];
    propertyType?: string[];
    spaceToBeDesigned?: string[];
    size?: string[];
    status?: string[];
    style?: string[];
    budget?: string[];
    completionDate?: string[];
    servicesRequired?: string[];
    preferredDate?: string[];
    server?: string[];
  };
  success: boolean;
};

export async function handleBooking(
  prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  const validatedFields = bookingSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your entries.",
      success: false,
    };
  }

  const { email, fullName, ...bookingDetails } = validatedFields.data;

  try {
    // **Email Sending Simulation**
    // In a real application, you would use a service like Resend, SendGrid, or Nodemailer here.
    // For this demonstration, we will just log the details to the server console
    // to simulate sending a confirmation email and notifying the admin.

    console.log("--- New Detailed Booking Request ---");
    console.log("Client Name:", fullName);
    console.log("Client Email:", email);
    console.log("Full Booking Details:", JSON.stringify(bookingDetails, null, 2));
    console.log("--- End of Booking Request ---");
    
    // Simulate a successful API call to an email service.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      message: "Booking request submitted successfully!",
      success: true,
    };

  } catch (error) {
    console.error("Booking submission error:", error);
    return {
      message: "An unexpected error occurred on the server.",
      errors: {
        server: ["Could not process your booking request. Please try again later."],
      },
      success: false,
    };
  }
}
