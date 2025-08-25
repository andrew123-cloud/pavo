// src/app/actions/booking.ts
"use server";

import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  service: z.enum(["consultation", "styling", "edecor"], {
    errorMap: () => ({ message: "Please select a valid service." }),
  }),
  details: z.string().min(10, { message: "Project details must be at least 10 characters." }),
});

export type BookingState = {
  message?: string | null;
  errors?: {
    name?: string[];
    email?: string[];
    service?: string[];
    details?: string[];
    server?: string[];
  };
  success: boolean;
};

export async function handleBooking(
  prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  const validatedFields = bookingSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    service: formData.get("service"),
    details: formData.get("details"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your entries.",
      success: false,
    };
  }

  const { name, email, service, details } = validatedFields.data;

  try {
    // **Email Sending Simulation**
    // In a real application, you would use a service like Resend, SendGrid, or Nodemailer here.
    // For this demonstration, we will just log the details to the server console
    // to simulate sending a confirmation email and notifying the admin.

    console.log("--- New Booking Request ---");
    console.log("Client Name:", name);
    console.log("Client Email:", email);
    console.log("Service Requested:", service);
    console.log("Project Details:", details);
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
