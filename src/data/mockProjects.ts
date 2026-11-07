// Demo covers are imported so the build includes them (raw /src paths only work in dev)
import coverBaile from '../assets/images/album_baile_saopaulo_1793848443588.jpg';
import coverTechno from '../assets/images/album_berlin_techno_1793848443938.jpg';
import coverGarage from '../assets/images/album_ukgarage_london_1793848444077.jpg';
import { MusicProject, UserProfile } from '../types/music';

const SOURCE_PROJECTS: MusicProject[] = [
  {
    id: 'proj-sp-01',
    title: 'SUBTERRÂNEO: A LUZ DO CAOS',
    slug: 'subterraneo-luz-do-caos',
    artistName: 'Coletivo Urbano SP',
    artistHandle: '@coletivourbano.sp',
    artistBio: 'Coletivo independente de música eletrônica e baile funk experimental sediado na Barra Funda, São Paulo.',
    releaseDate: '2026-10-18',
    genre: 'Baile Funk & Experimental',
    subgenre: 'Deconstructed Club / Post-Baile',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    coordinates: {
      lat: -23.5505,
      lng: -46.6333,
    },
    coverArt: coverBaile,
    accentColor: '#3b82f6',
    pricingModel: 'paid',
    priceBrl: 25.00,
    audioQuality: '24-bit / 96kHz Lossless FLAC',
    catalogNumber: 'SP-088-RAW',
    description: 'Gravações captadas nas madrugadas úmidas do centro de São Paulo. Ritmos síncopados de tambor com sintetizadores industriais e subgraves analógicos de fita cassete.',
    linerNotes: 'Masterizado no estúdio Santa Cecília. Produção 100% autônoma sem intermediação de gravadoras multinacionais.',
    tags: ['São Paulo', 'Baile Funk', 'Industrial', 'Post-Baile', 'Centro SP'],
    physicalMerch: [
      {
        id: 'merch-sp-1',
        type: 'Fita Cassete',
        title: 'Fita C-60 Fumê Edição Limitada (50 cópias)',
        priceBrl: 45.00,
        stock: 12,
        includesDigital: true,
      },
      {
        id: 'merch-sp-2',
        type: 'Zine Fotográfico',
        title: 'Zine Fotográfico 32p "Madrugadas de Concreto"',
        priceBrl: 20.00,
        stock: 28,
        includesDigital: true,
      }
    ],
    versions: [
      { id: 'v3', name: 'Master Oficial 24/96', tag: 'Master', date: 'Out 2026', isLatest: true, notes: 'Masterização final analógica' },
      { id: 'v2', name: 'Rough Mixdown Studio 4', tag: 'Mixdown v2', date: 'Set 2026', isLatest: false, notes: 'Mixagem com baterias secas' },
      { id: 'v1', name: 'Demo 4-Track Cassette', tag: 'Demo v1', date: 'Jul 2026', isLatest: false, notes: 'Gravação original em Tascam' }
    ],
    tracks: [
      {
        id: 'track-sp-1',
        title: 'Eco das Marquises',
        durationSec: 218,
        trackNumber: 1,
        bpm: 130,
        keySignature: 'F# minor',
        waveform: [18, 32, 65, 88, 95, 72, 85, 90, 60, 45, 80, 92, 100, 85, 70, 90, 94, 65, 40, 20, 50, 75, 88, 92, 60, 45, 80, 70, 30, 15]
      },
      {
        id: 'track-sp-2',
        title: 'Minhocão Neon',
        durationSec: 194,
        trackNumber: 2,
        bpm: 132,
        keySignature: 'A minor',
        waveform: [25, 45, 70, 80, 60, 75, 90, 85, 70, 55, 65, 85, 95, 80, 70, 60, 85, 90, 65, 45, 70, 85, 90, 75, 50, 35, 60, 80, 40, 20]
      },
      {
        id: 'track-sp-3',
        title: 'Asfalto Frio (Outro)',
        durationSec: 162,
        trackNumber: 3,
        bpm: 125,
        keySignature: 'D minor',
        waveform: [10, 20, 35, 50, 60, 40, 50, 65, 55, 45, 60, 70, 65, 50, 40, 50, 60, 50, 40, 30, 25, 35, 40, 30, 20, 15, 10, 15, 10, 5]
      }
    ],
    stats: {
      totalStreams: 14280,
      totalSalesCount: 184,
      grossRevenueBrl: 4600.00,
      netArtistRevenueBrl: 4140.00,
      supportersCount: 168,
      completionRate: 88,
      averageRating: 4.8,
      totalReviewsCount: 3,
      topRegions: [
        { region: 'São Paulo (SP)', plays: 8420, revenue: 2850.00 },
        { region: 'Rio de Janeiro (RJ)', plays: 2150, revenue: 720.00 },
        { region: 'Belo Horizonte (MG)', plays: 1420, revenue: 510.00 },
        { region: 'Curitiba (PR)', plays: 980, revenue: 320.00 }
      ],
      recentPurchases: [
        { id: 'p1', projectTitle: 'SUBTERRÂNEO: A LUZ DO CAOS', amount: 25.00, time: '12 min atrás', method: 'pix' },
        { id: 'p2', projectTitle: 'SUBTERRÂNEO: A LUZ DO CAOS', amount: 45.00, time: '1h atrás', method: 'cartao_credito' },
        { id: 'p3', projectTitle: 'SUBTERRÂNEO: A LUZ DO CAOS', amount: 25.00, time: '3h atrás', method: 'nupay_picpay' }
      ]
    },
    supporters: [
      { id: 'sup-1', name: 'Matheus Costa', amountPaidBrl: 25.00, date: '2026-11-02', comment: 'A mixagem analógica ficou visceral. Salvou meu final de semana!', paymentMethod: 'pix' },
      { id: 'sup-2', name: 'Marina L.', amountPaidBrl: 45.00, date: '2026-11-01', comment: 'Apoio total da cena de Pinheiros. Trabalho impecável.', paymentMethod: 'cartao_credito' }
    ],
    reviews: [
      {
        id: 'rev-1',
        projectId: 'proj-sp-01',
        projectTitle: 'SUBTERRÂNEO: A LUZ DO CAOS',
        userId: 'usr-1',
        userName: 'Thiago Mendes',
        userHandle: '@thiagom_critica',
        rating: 5.0,
        reviewText: 'Obra prima do post-baile brasileiro. O trabalho de sub-frequências em "Eco das Marquises" cria uma sensação de imersão que poucas produções recentes de São Paulo conseguiram alcançar.',
        tags: ['Essencial', 'Bass Brutal', 'Club SP'],
        date: 'Há 2 dias',
        likesCount: 24,
        isSupporter: true
      },
      {
        id: 'rev-2',
        projectId: 'proj-sp-01',
        projectTitle: 'SUBTERRÂNEO: A LUZ DO CAOS',
        userId: 'usr-2',
        userName: 'Lívia Castro',
        userHandle: '@livia_discoteca',
        rating: 4.5,
        reviewText: 'Adorei a textura crua da fita cassete. Uma abordagem livre de fórmulas comerciais de streaming. "Minhocão Neon" merece entrar em qualquer set de pista fechada.',
        tags: ['Analog Tape', 'São Paulo Noite'],
        date: 'Há 4 dias',
        likesCount: 16,
        isSupporter: true
      }
    ]
  },
  {
    id: 'proj-ssa-02',
    title: 'AFRO-PULSO: ELETRÔNICA DO PELÔ',
    slug: 'afro-pulso-eletronica-do-pelo',
    artistName: 'Ilê Sintético',
    artistHandle: '@ilesintetico',
    artistBio: 'Produtores de Salvador mesclando tambores de candomblé, samba-reggae e sintetizadores polifônicos analógicos.',
    releaseDate: '2026-10-12',
    genre: 'Afro-Bass & Samba-Reggae',
    subgenre: 'Afro-Eletrônica / Batucada Futurista',
    city: 'Salvador',
    state: 'BA',
    country: 'Brasil',
    coordinates: {
      lat: -12.9777,
      lng: -38.5016,
    },
    coverArt: coverBaile,
    accentColor: '#f59e0b',
    pricingModel: 'name_your_price',
    priceBrl: 15.00,
    minPriceBrl: 10.00,
    audioQuality: '24-bit / 96kHz Lossless FLAC',
    catalogNumber: 'SSA-012',
    description: 'A força ancestral dos tambores do Pelourinho processada em pedais analógicos de delay e sintetizadores polifônicos.',
    linerNotes: 'Gravado ao vivo na Ladeira do Carmo em Salvador. Apoio direto ao núcleo de preservação de ritmos afro-baianos.',
    tags: ['Salvador', 'Afro-Bass', 'Samba-Reggae', 'Bahia', 'Eletrônica Ancestral'],
    physicalMerch: [
      {
        id: 'merch-ssa-1',
        type: 'Vinil 12"',
        title: 'Vinil 12" Amarelo Solar Prensagem Limitada',
        priceBrl: 120.00,
        stock: 40,
        includesDigital: true,
      }
    ],
    versions: [
      { id: 'v1', name: 'Master Estúdio Ladeira', tag: 'Master', date: 'Out 2026', isLatest: true }
    ],
    tracks: [
      {
        id: 'track-ssa-1',
        title: 'Ladeira do Fogo Sagrado',
        durationSec: 245,
        trackNumber: 1,
        bpm: 118,
        keySignature: 'G major',
        waveform: [15, 30, 50, 75, 90, 85, 70, 85, 95, 80, 65, 80, 90, 85, 75, 65, 80, 85, 70, 55, 65, 75, 80, 65, 50, 35, 45, 55, 30, 15]
      },
      {
        id: 'track-ssa-2',
        title: 'Oxóssi Sintético',
        durationSec: 280,
        trackNumber: 2,
        bpm: 120,
        keySignature: 'D minor',
        waveform: [20, 35, 60, 80, 95, 90, 75, 90, 100, 85, 70, 85, 95, 90, 80, 70, 85, 90, 75, 60, 70, 85, 90, 70, 55, 40, 50, 60, 35, 20]
      }
    ],
    stats: {
      totalStreams: 21400,
      totalSalesCount: 230,
      grossRevenueBrl: 4140.00,
      netArtistRevenueBrl: 3726.00,
      supportersCount: 215,
      completionRate: 94,
      averageRating: 4.9,
      totalReviewsCount: 2,
      topRegions: [
        { region: 'Salvador (BA)', plays: 12300, revenue: 2100.00 },
        { region: 'Recife (PE)', plays: 3400, revenue: 780.00 },
        { region: 'São Paulo (SP)', plays: 4100, revenue: 920.00 }
      ],
      recentPurchases: [
        { id: 'p1', projectTitle: 'AFRO-PULSO', amount: 15.00, time: '20 min atrás', method: 'pix' }
      ]
    },
    supporters: [
      { id: 'sup-1', name: 'Claudio Bahiano', amountPaidBrl: 20.00, date: '2026-11-03', comment: 'A batida toca direto no coração. Axé!', paymentMethod: 'pix' }
    ],
    reviews: [
      {
        id: 'rev-ssa-1',
        projectId: 'proj-ssa-02',
        projectTitle: 'AFRO-PULSO: ELETRÔNICA DO PELÔ',
        userId: 'usr-3',
        userName: 'Renato Araújo',
        userHandle: '@renato_grooves',
        rating: 5.0,
        reviewText: 'A fusão entre os tambores graves do samba-reggae e as texturas de sintetizador é perfeita. "Oxóssi Sintético" é uma das faixas do ano no Brasil.',
        tags: ['Ancestralidade', 'Groove Baiano', 'Masterclass'],
        date: 'Ontem',
        likesCount: 31,
        isSupporter: true
      }
    ]
  },
  {
    id: 'proj-rec-03',
    title: 'MANGUE-CIRCUITO // LAMA DIGITAL',
    slug: 'mangue-circuito-lama-digital',
    artistName: 'Alfaias & Silício',
    artistHandle: '@alfaiasesilicio',
    artistBio: 'Coletivo recifense conectando maracatu atômico contemporâneo com dubstep, breakbeat e modular.',
    releaseDate: '2026-10-01',
    genre: 'Manguebeat & Breakbeat',
    subgenre: 'Cyber-Maracatu / Bass Pernambucano',
    city: 'Recife',
    state: 'PE',
    country: 'Brasil',
    coordinates: {
      lat: -8.0476,
      lng: -34.8770,
    },
    coverArt: coverGarage,
    accentColor: '#10b981',
    pricingModel: 'free',
    priceBrl: 0,
    audioQuality: '24-bit / 96kHz Lossless FLAC',
    catalogNumber: 'REC-CYBER-04',
    description: 'Projeto disponibilizado gratuitamente para a cultura livre. Alfaias afinadas no grave com processamento de distorção de fita.',
    linerNotes: 'Licenciado sob Creative Commons BY-SA. Se curtir, deixe uma avaliação no mural ou contribua espontaneamente.',
    tags: ['Recife', 'Manguebeat', 'Cultura Livre', 'Maracatu', 'Pernambuco'],
    physicalMerch: [
      {
        id: 'merch-rec-1',
        type: 'Camiseta Oficial',
        title: 'Camiseta Silk "Lama & Silício" Algodão 100%',
        priceBrl: 65.00,
        stock: 25,
        includesDigital: true,
      }
    ],
    versions: [
      { id: 'v1', name: 'Master Lossless Gratuito', tag: 'Master', date: 'Out 2026', isLatest: true }
    ],
    tracks: [
      {
        id: 'track-rec-1',
        title: 'Caranguejo de Silício',
        durationSec: 230,
        trackNumber: 1,
        bpm: 128,
        keySignature: 'E minor',
        waveform: [12, 28, 55, 80, 92, 85, 78, 90, 88, 70, 60, 85, 95, 88, 72, 85, 94, 90, 60, 40, 75, 88, 95, 80, 65, 45, 80, 75, 35, 15]
      }
    ],
    stats: {
      totalStreams: 18900,
      totalSalesCount: 45,
      grossRevenueBrl: 1125.00,
      netArtistRevenueBrl: 1012.50,
      supportersCount: 62,
      completionRate: 91,
      averageRating: 4.7,
      totalReviewsCount: 2,
      topRegions: [
        { region: 'Recife (PE)', plays: 11400, revenue: 580.00 },
        { region: 'Fortaleza (CE)', plays: 3200, revenue: 210.00 }
      ],
      recentPurchases: [
        { id: 'p1', projectTitle: 'MANGUE-CIRCUITO', amount: 20.00, time: '3h atrás', method: 'pix' }
      ]
    },
    supporters: [
      { id: 'sup-1', name: 'Danilo Recife', amountPaidBrl: 20.00, date: '2026-11-01', comment: 'O manguebeat vive na lama digital!', paymentMethod: 'pix' }
    ],
    reviews: [
      {
        id: 'rev-rec-1',
        projectId: 'proj-rec-03',
        projectTitle: 'MANGUE-CIRCUITO // LAMA DIGITAL',
        userId: 'usr-1',
        userName: 'Thiago Mendes',
        userHandle: '@thiagom_critica',
        rating: 4.5,
        reviewText: 'Espírito genuíno do manguebeat adaptado para o sound design contemporâneo. A alfaia tem peso de 808 e as guitarras mantêm a psicodelia.',
        tags: ['Cultura Livre', 'Pernambuco', 'Peso'],
        date: 'Há 3 dias',
        likesCount: 19,
        isSupporter: false
      }
    ]
  },
  {
    id: 'proj-bel-04',
    title: 'TECNOSFERA: GUITARRADA DO FUTURO',
    slug: 'tecnosfera-guitarrada-do-futuro',
    artistName: 'Amazônia Glitch',
    artistHandle: '@amazoniaglitch',
    artistBio: 'Produtores de Belém do Pará misturando guitarrada tradicional paraense com batidas frenéticas de tecnobrega.',
    releaseDate: '2026-10-25',
    genre: 'Tecnobrega & Guitarrada',
    subgenre: 'Future-Guitarrada / Eletro-Carimbó',
    city: 'Belém',
    state: 'PA',
    country: 'Brasil',
    coordinates: {
      lat: -1.4558,
      lng: -48.4902,
    },
    coverArt: coverTechno,
    accentColor: '#a855f7',
    pricingModel: 'paid',
    priceBrl: 18.00,
    audioQuality: '24-bit / 96kHz Lossless FLAC',
    catalogNumber: 'PA-091',
    description: 'Riffs ágeis de guitarrada paraense colidindo com sintetizadores de alta velocidade das aparelhagens de Belém.',
    linerNotes: 'Masterizado para soar ensurdecedor nos paredões de som do Jurunas. Apoio aos mestres da guitarrada.',
    tags: ['Belém', 'Tecnobrega', 'Guitarrada', 'Aparelhagem', 'Pará'],
    physicalMerch: [
      {
        id: 'merch-bel-1',
        type: 'CD Digipak',
        title: 'CD Digipak Edição de Aparelhagem',
        priceBrl: 30.00,
        stock: 30,
        includesDigital: true,
      }
    ],
    versions: [
      { id: 'v1', name: 'Master Aparelhagem 24/96', tag: 'Master', date: 'Out 2026', isLatest: true }
    ],
    tracks: [
      {
        id: 'track-bel-1',
        title: 'Raio de Trovão no Guamá',
        durationSec: 198,
        trackNumber: 1,
        bpm: 142,
        keySignature: 'A major',
        waveform: [15, 25, 40, 58, 70, 82, 88, 85, 75, 60, 72, 84, 90, 82, 70, 80, 88, 85, 65, 50, 70, 80, 85, 75, 60, 45, 60, 50, 25, 10]
      }
    ],
    stats: {
      totalStreams: 25100,
      totalSalesCount: 195,
      grossRevenueBrl: 3510.00,
      netArtistRevenueBrl: 3159.00,
      supportersCount: 180,
      completionRate: 95,
      averageRating: 4.8,
      totalReviewsCount: 2,
      topRegions: [
        { region: 'Belém (PA)', plays: 16200, revenue: 2200.00 },
        { region: 'Manaus (AM)', plays: 4300, revenue: 640.00 }
      ],
      recentPurchases: [
        { id: 'p1', projectTitle: 'TECNOSFERA', amount: 18.00, time: '1h atrás', method: 'pix' }
      ]
    },
    supporters: [
      { id: 'sup-1', name: 'Julio Paraense', amountPaidBrl: 18.00, date: '2026-11-03', comment: 'Guitarrada no talo! Som perfeito.', paymentMethod: 'pix' }
    ],
    reviews: [
      {
        id: 'rev-bel-1',
        projectId: 'proj-bel-04',
        projectTitle: 'TECNOSFERA: GUITARRADA DO FUTURO',
        userId: 'usr-2',
        userName: 'Lívia Castro',
        userHandle: '@livia_discoteca',
        rating: 5.0,
        reviewText: 'A energia da guitarrada com o bpm acelerado do tecnobrega cria uma química irresistível. Não tem como ficar parado.',
        tags: ['Aparelhagem', 'Belém', 'Eletrizante'],
        date: 'Há 1 dia',
        likesCount: 14,
        isSupporter: true
      }
    ]
  },
  {
    id: 'proj-bh-05',
    title: 'SERRA DO CURRAL // ECO MODULAR',
    slug: 'serra-do-curral-eco-modular',
    artistName: 'Manto Modular',
    artistHandle: '@mantomodular',
    artistBio: 'Produtor e sound designer mineiro explorando sintetizadores modulares eurorack e gravações de campo nas serras de Minas Gerais.',
    releaseDate: '2026-10-24',
    genre: 'Ambient & Sintetizadores',
    subgenre: 'Modular Drone / Paisagem Sonora',
    city: 'Belo Horizonte',
    state: 'MG',
    country: 'Brasil',
    coordinates: {
      lat: -19.9167,
      lng: -43.9345,
    },
    coverArt: coverBaile,
    accentColor: '#10b981',
    pricingModel: 'free',
    priceBrl: 0,
    audioQuality: '24-bit / 96kHz Lossless FLAC',
    catalogNumber: 'BH-MOD-05',
    description: 'Disponível livremente sem restrições. Gravações de campo binaurais captadas na Serra do Curral fundidas com síntese modular analógica.',
    linerNotes: 'Cultura livre sob licença Creative Commons. Produzido com apoio de editais independentes de Minas.',
    tags: ['Belo Horizonte', 'Minas Gerais', 'Ambient', 'Modular', 'Paisagem Sonora'],
    versions: [
      { id: 'v1', name: 'Master Lossless 24/96', tag: 'Master', date: 'Out 2026', isLatest: true }
    ],
    tracks: [
      {
        id: 'track-bh-1',
        title: 'Neblina sobre as Cumeadas',
        durationSec: 285,
        trackNumber: 1,
        bpm: 80,
        keySignature: 'C major',
        waveform: [8, 15, 25, 40, 50, 45, 60, 68, 55, 40, 52, 65, 70, 60, 50, 58, 65, 55, 45, 35, 48, 55, 60, 50, 42, 30, 38, 25, 15, 8]
      }
    ],
    stats: {
      totalStreams: 18420,
      totalSalesCount: 120,
      grossRevenueBrl: 0,
      netArtistRevenueBrl: 0,
      supportersCount: 94,
      completionRate: 94,
      averageRating: 4.9,
      totalReviewsCount: 1,
      topRegions: [
        { region: 'Belo Horizonte (MG)', plays: 12800, revenue: 0 },
        { region: 'São Paulo (SP)', plays: 3200, revenue: 0 }
      ],
      recentPurchases: []
    },
    supporters: [],
    reviews: [
      {
        id: 'rev-bh-1',
        projectId: 'proj-bh-05',
        projectTitle: 'SERRA DO CURRAL // ECO MODULAR',
        userId: 'usr-3',
        userName: 'Renato Araújo',
        userHandle: '@renato_grooves',
        rating: 5.0,
        reviewText: 'Paz profunda. A gravação espacial do vento nas montanhas de Minas com osciladores analógicos é de uma fidelidade assustadora.',
        tags: ['Meditação', 'Minas Gerais', 'Imersivo'],
        date: 'Há 5 dias',
        likesCount: 20,
        isSupporter: false
      }
    ]
  }
];

export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'usr-1',
    name: 'Thiago Mendes',
    handle: '@thiagom_critica',
    bio: 'Pesquisador de música independente brasileira e entusiasta de post-baile e manguebeat.',
    city: 'Taguatinga',
    state: 'DF',
    joinedDate: 'Março 2026',
    ratedProjectsCount: 38,
    reviewsCount: 19,
    favoriteGenres: ['Baile Funk & Experimental', 'Manguebeat', 'Dubstep'],
    recentReviews: [
      {
        id: 'rev-1',
        projectId: 'proj-sp-01',
        projectTitle: 'SUBTERRÂNEO: A LUZ DO CAOS',
        userId: 'usr-1',
        userName: 'Thiago Mendes',
        userHandle: '@thiagom_critica',
        rating: 5.0,
        reviewText: 'Obra prima do post-baile brasileiro. O trabalho de sub-frequências em "Eco das Marquises" cria uma sensação de imersão visceral.',
        tags: ['Essencial', 'Bass Brutal'],
        date: 'Há 2 dias',
        likesCount: 24,
        isSupporter: true
      },
      {
        id: 'rev-rec-1',
        projectId: 'proj-rec-03',
        projectTitle: 'MANGUE-CIRCUITO // LAMA DIGITAL',
        userId: 'usr-1',
        userName: 'Thiago Mendes',
        userHandle: '@thiagom_critica',
        rating: 4.5,
        reviewText: 'Espírito genuíno do manguebeat adaptado para o sound design contemporâneo.',
        tags: ['Cultura Livre', 'Pernambuco'],
        date: 'Há 3 dias',
        likesCount: 19,
        isSupporter: false
      }
    ],
    topFavorites: ['proj-sp-01', 'proj-ssa-02', 'proj-bel-04', 'proj-rec-03', 'proj-bh-05'],
    libraryProjectIds: ['proj-sp-01', 'proj-ssa-02'],
    savedProjectIds: ['proj-bel-04', 'proj-rec-03']
  },
  {
    id: 'usr-2',
    name: 'Lívia Castro',
    handle: '@livia_discoteca',
    bio: 'DJ de pesquisa, colecionadora de cassetes e entusiasta de aparelhagens do Pará.',
    city: 'Sobradinho',
    state: 'DF',
    joinedDate: 'Fevereiro 2026',
    ratedProjectsCount: 52,
    reviewsCount: 27,
    favoriteGenres: ['Tecnobrega & Guitarrada', 'Baile Funk', 'House'],
    recentReviews: [
      {
        id: 'rev-bel-1',
        projectId: 'proj-bel-04',
        projectTitle: 'TECNOSFERA: GUITARRADA DO FUTURO',
        userId: 'usr-2',
        userName: 'Lívia Castro',
        userHandle: '@livia_discoteca',
        rating: 5.0,
        reviewText: 'A energia da guitarrada com o bpm acelerado do tecnobrega cria uma química irresistível.',
        tags: ['Aparelhagem', 'Belém'],
        date: 'Há 1 dia',
        likesCount: 14,
        isSupporter: true
      }
    ],
    topFavorites: ['proj-bel-04', 'proj-sp-01'],
    libraryProjectIds: ['proj-bel-04'],
    savedProjectIds: ['proj-sp-01', 'proj-ssa-02']
  },
  {
    id: 'usr-3',
    name: 'Renato Araújo',
    handle: '@renato_grooves',
    bio: 'Músico e produtor focado em ritmos afro-brasileiros e texturas binaurais.',
    city: 'Valparaíso de Goiás',
    state: 'GO',
    joinedDate: 'Janeiro 2026',
    ratedProjectsCount: 44,
    reviewsCount: 21,
    favoriteGenres: ['Afro-Bass & Samba-Reggae', 'Ambient', 'Jazz Contemporâneo'],
    recentReviews: [
      {
        id: 'rev-ssa-1',
        projectId: 'proj-ssa-02',
        projectTitle: 'AFRO-PULSO: ELETRÔNICA DO PELÔ',
        userId: 'usr-3',
        userName: 'Renato Araújo',
        userHandle: '@renato_grooves',
        rating: 5.0,
        reviewText: 'A fusão entre os tambores graves do samba-reggae e as texturas de sintetizador é perfeita.',
        tags: ['Ancestralidade', 'Groove Baiano'],
        date: 'Ontem',
        likesCount: 31,
        isSupporter: true
      }
    ],
    topFavorites: ['proj-ssa-02', 'proj-bh-05', 'proj-rec-03'],
    libraryProjectIds: ['proj-ssa-02', 'proj-bh-05'],
    savedProjectIds: ['proj-sp-01']
  }
];

/**
 * Placeholder releases for the DF + Entorno launch phase, built from the
 * original samples (same ids, covers and tracks). All marked [DEMO]:
 * remove before going live.
 */
const DEMO_PLACES: { id: string; city: string; state: string; lat: number; lng: number }[] = [
  { id: 'proj-sp-01', city: 'Ceilândia', state: 'DF', lat: -15.8205, lng: -48.1132 },
  { id: 'proj-ssa-02', city: 'Taguatinga', state: 'DF', lat: -15.8335, lng: -48.0566 },
  { id: 'proj-rec-03', city: 'Brasília (Plano Piloto)', state: 'DF', lat: -15.7938, lng: -47.8827 },
  { id: 'proj-bel-04', city: 'Gama', state: 'DF', lat: -16.0169, lng: -48.0652 },
  { id: 'proj-bh-05', city: 'Águas Lindas de Goiás', state: 'GO', lat: -15.7617, lng: -48.2817 },
];

export const INITIAL_PROJECTS: MusicProject[] = SOURCE_PROJECTS.flatMap((p, i) => {
  const place = DEMO_PLACES.find((d) => d.id === p.id);
  if (!place) return [];
  const where = place.state === 'DF' ? `${place.city} (DF)` : `${place.city} (GO)`;
  return [
    {
      ...p,
      title: `[DEMO] ${p.title}`,
      artistName: `Artista Exemplo ${i + 1}`,
      artistHandle: `@exemplo${i + 1}`,
      artistBio: `Perfil de exemplo em ${where}. Será substituído por artistas reais antes do lançamento.`,
      city: place.city,
      state: place.state,
      coordinates: { lat: place.lat, lng: place.lng },
      description: `Lançamento de demonstração posicionado em ${where} para testar o mapa do TN1 Radar.`,
      linerNotes: 'Conteúdo de exemplo. Áudio e capa provisórios.',
      tags: [p.genre, place.city, place.state, 'Demo'],
      stats: { ...p.stats, topRegions: [{ region: where, plays: 0, revenue: 0 }] },
    },
  ];
});
