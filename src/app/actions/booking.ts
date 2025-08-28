
// src/app/actions/booking.ts
"use server";

// This file is no longer actively used for form submission.
// The client-side form in `src/components/shared/booking-form.tsx` now
// handles validation, email sending via EmailJS, and saving the booking
// to the DataContext directly. This file is kept for posterity but
// can be removed if no other server-side booking logic is needed.

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
