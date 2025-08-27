// src/app/actions/booking.ts
"use server";

// This file is kept for potential future server-side logic,
// but the booking form now uses a client-side submission process with react-hook-form.
// The validation and submission logic is co-located in src/components/shared/booking-form.tsx.

export type BookingState = {
  message?: string | null;
  errors?: any;
  success: boolean;
};

// This function is no longer actively used by the form.
export async function handleBooking(
  prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
   console.log("Server action 'handleBooking' was called, but is not actively used for form submission.");
   return {
      message: "This server action is not currently in use.",
      success: false,
   };
}
