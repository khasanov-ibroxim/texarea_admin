export type BlogType = 'interview' | 'article' | 'fact';
export type Language = 'ru' | 'en' | 'es' | 'fr';

export interface ContentBlock {
  text?: string;
  title?: string;
  quote?: string;
  list?: string[];
  image?: string;  // ← YANGI: Content ichidagi rasm
}

export interface BlogTranslation {
  title: string;
  date: string;
  source?: string;
  content: ContentBlock[];
}

export interface Blog {
  id: number;
  type: BlogType;
  created_at: string;
  updated_at: string;
  translations?: {
    [key in Language]?: BlogTranslation;
  };
}

export interface BlogFormData {
  type: BlogType;
  blogs: {
    [key in Language]: BlogTranslation;
  };
  images?: {
    [key in Language]: string[];
  };
}

export interface User {
  username: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface UploadedImage {
  filename: string;
  url: string;
  size: number;
  createdAt?: string;
}