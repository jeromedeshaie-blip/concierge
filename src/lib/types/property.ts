export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  ical_airbnb_url: string | null;
  ical_booking_url: string | null;
  ical_last_sync: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PropertyWithOwner extends Property {
  profiles: {
    full_name: string;
  };
}
