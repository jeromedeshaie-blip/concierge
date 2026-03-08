export interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  guest_count: number;
  check_in: string;
  check_out: string;
  status: "confirmed" | "cancelled" | "completed";
  source: "airbnb" | "booking" | "direct" | "other";
  total_amount: number | null;
  external_uid: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BookingWithProperty extends Booking {
  properties: {
    name: string;
  };
}

export const statusLabels: Record<Booking["status"], string> = {
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

export const sourceLabels: Record<Booking["source"], string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  direct: "Direct",
  other: "Autre",
};
