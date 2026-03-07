export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PropertyWithOwner extends Property {
  profiles: {
    full_name: string;
  };
}
