/**
 * Manual API types — replace with `openapi-typescript` generated `schema.d.ts`
 * by running `make gen-api` once the backend is up.
 */

export interface UserMe {
  id: string;
  email: string;
  display_name: string;
  locale: "uk" | "en";
  is_email_verified: boolean;
  created_at: string;
}

export interface Baby {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  gestational_age_weeks: number;
  is_preterm: boolean;
  chronological_age_days: number;
  corrected_age_days: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  baby: string | null;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  rank: number;
  similarity: number;
  chunk_id: string;
  document_id: string;
  document_title: string;
  source_url: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  token_count: number;
  created_at: string;
  citations: Citation[];
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface TokenPair {
  access: string;
  refresh: string;
}
