export type PricingModel = 'free' | 'paid' | 'name_your_price';

export interface TrackVersion {
  id: string;
  name: string;
  tag: 'Master' | 'Mixdown v2' | 'Demo v1' | 'Instrumental' | 'Ao Vivo';
  date: string;
  isLatest: boolean;
  notes?: string;
}

export interface Track {
  id: string;
  title: string;
  durationSec: number;
  trackNumber: number;
  bpm: number;
  keySignature: string;
  waveform: number[];
  previewOnly?: boolean;
  audioUrl?: string;
  audioFileName?: string;
  audioFileSize?: string;
}

export interface PhysicalMerch {
  id: string;
  type: 'Vinil 12"' | 'Fita Cassete' | 'CD Digipak' | 'Zine Fotográfico' | 'Camiseta Oficial';
  title: string;
  priceBrl: number;
  stock: number;
  includesDigital: boolean;
}

// Reprised.app community review structure
export interface ReprisedReview {
  id: string;
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar?: string;
  rating: number; // 1.0 to 5.0 (supports half stars)
  reviewText: string;
  tags?: string[];
  date: string;
  likesCount: number;
  isSupporter?: boolean; // badge if user purchased the release
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  bio: string;
  city: string;
  state: string;
  joinedDate: string;
  ratedProjectsCount: number;
  reviewsCount: number;
  favoriteGenres: string[];
  recentReviews: ReprisedReview[];
  topFavorites: string[]; // up to 5 project IDs in spotlight
  libraryProjectIds: string[]; // purchased/downloaded projects
  savedProjectIds: string[]; // saved/wishlist projects
  createdProjectIds?: string[]; // projects launched or in progress by the artist
}

export interface Supporter {
  id: string;
  name: string;
  amountPaidBrl: number;
  date: string;
  comment?: string;
  paymentMethod: 'pix' | 'cartao_credito' | 'boleto' | 'nupay_picpay';
}

export interface ProjectStats {
  totalStreams: number;
  totalSalesCount: number;
  grossRevenueBrl: number;
  netArtistRevenueBrl: number;
  supportersCount: number;
  completionRate: number; // e.g. 92%
  averageRating: number; // e.g. 4.7
  totalReviewsCount: number;
  topRegions: { region: string; plays: number; revenue: number }[];
  recentPurchases: { id: string; projectTitle: string; amount: number; time: string; method: string }[];
}

export interface MusicProject {
  id: string;
  title: string;
  slug: string;
  artistName: string;
  artistHandle: string;
  artistBio: string;
  releaseDate: string;
  genre: string;
  subgenre: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverArt: string;
  accentColor: string;
  pricingModel: PricingModel;
  priceBrl: number; // 0 if free, e.g. 15.00 if paid
  minPriceBrl?: number; // for name_your_price
  audioQuality: '24-bit / 96kHz Lossless FLAC' | '24-bit / 48kHz Master WAV' | 'Gravação Direta de Fita';
  catalogNumber: string;
  description: string;
  linerNotes: string;
  tags: string[];
  physicalMerch?: PhysicalMerch[];
  versions: TrackVersion[];
  tracks: Track[];
  stats: ProjectStats;
  supporters: Supporter[];
  reviews: ReprisedReview[];
}
