import type { MDXInstance } from 'astro';

export interface TocItem {
  name: string;
  hash: string;
  icon: string;
  children?: TocItem[];
}

export interface BlogFrontmatter {
  title: string;
  date: string;
  dateUX: string;
  description: string;
  coverImage: string;
  coverImageAlt?: string;
  tags: string[];
  toc: TocItem[];
  isOld?: boolean;
  archiveUrl?: string;
  channelPostUrlId?: number;
}

export type BlogPost = MDXInstance<BlogFrontmatter>;
