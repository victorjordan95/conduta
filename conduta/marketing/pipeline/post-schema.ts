export type MarketingStatus = 'draft' | 'approved' | 'published';

export type MarketingFormat =
  | 'carousel'
  | 'static'
  | 'reel-cover'
  | 'story'
  | 'product-demo';

export type SlideRole =
  | 'cover'
  | 'context'
  | 'problem'
  | 'content'
  | 'feature'
  | 'cta';

export interface MarketingSlide {
  number: number;
  role: SlideRole;
  title?: string;
  body?: string;
  bullets: string[];
  emphasis: string[];
  illustrationPrompt?: string;
  screenshot?: string;
}

export interface MarketingPost {
  id: string;
  slug: string;
  status: MarketingStatus;
  format: MarketingFormat;
  template: string;
  pillar: string;
  objective: string;
  audience: string;
  funnelStage: string;
  relatedFeature: string;
  pain: string;
  title: string;
  hook?: string;
  caption: string;
  cta?: string;
  hashtags: string[];
  slides: MarketingSlide[];
  visualGuidance: string;
  screenshots: string;
  visualElement: string;
  altText: string;
  safetyNotes: string;
  checklist: string;
  sourceFile: string;
}
