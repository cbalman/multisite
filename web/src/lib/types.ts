export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  totp_enabled?: boolean;
};

export type Social = { platform: string; url: string };

export type Site = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  city: string | null;
  category_id: number | null;
  category_name: string | null;
  status: string;
  theme: string;
  primary_color: string;
  whatsapp: string | null;
  phone1: string | null;
  phone2: string | null;
  socials: Social[];
  whatsapp_url: string | null;
  publication_count: number | null;
  onboarding_completed: boolean;
};

export type Publication = {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  price_visible: boolean;
  price_on_request: boolean;
  cover_image_url: string | null;
  video_url: string | null;
  images: string[];
  status: string;
  whatsapp_url: string | null;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" },
  { id: "web", label: "Sitio web" },
] as const;
