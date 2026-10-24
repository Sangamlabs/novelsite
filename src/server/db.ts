import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface NovelTranslation {
  title: string;
  synopsis: string;
}

export interface Novel {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  author: string;
  cover_url: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  available_languages: ('en' | 'jp' | 'hi')[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  translations?: Record<string, NovelTranslation>;
}

export interface ChapterTranslation {
  title: string;
  body: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  novel_slug: string;
  chapter_number: number;
  order_index: number;
  title: string;
  slug: string;
  body: string;
  language: 'en' | 'jp' | 'hi';
  status: 'published' | 'draft';
  cover_url?: string | null;
  published_at: string | null;
  created_at: string;
  word_count: number;
  translations?: Record<string, ChapterTranslation>;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'chapter_release' | 'novel_release' | 'update';
  action_label?: string | null;
  action_url?: string | null;
  image_url?: string | null;
  status: 'published' | 'draft';
  created_at: string;
  expires_at?: string | null;
}

export interface ReadingProgress {
  reader_id: string;
  novel_id: string;
  novel_slug: string;
  last_chapter_id: string;
  last_chapter_number: number;
  last_read_at: string;
  progress_percent: number;
}

export interface Comment {
  id: string;
  novel_id: string;
  novel_slug: string;
  author_name: string;
  content: string;
  status: 'approved' | 'pending' | 'hidden';
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'moderator';
  password_hash: string;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  featured_novel_slug: string;
  accent_color: string;
  footer_text: string;
  allow_comments: boolean;
  announcement_popup_enabled: boolean;
}

export interface DatabaseState {
  novels: Novel[];
  chapters: Chapter[];
  announcements: Announcement[];
  reading_progress: ReadingProgress[];
  comments: Comment[];
  admins: AdminUser[];
  settings: SiteSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'akhyana_store.json');

// Initial seed data with high-grade literary content
const DEFAULT_PASSWORD = 'akhyana_owner_2026';
const DEFAULT_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const SEED_NOVELS: Novel[] = [
  {
    id: 'nov-1',
    slug: 'the-whispering-canopy',
    title: 'The Whispering Canopy',
    synopsis: 'Within the deep primeval forest of Vael-Thorn stands an ancient arboreal library whose leaves remember every word ever whispered under heaven. When a young scholar decodes an exiled cartographer’s cipher, the tree roots begin to shift.',
    author: 'Eira Nightingale',
    cover_url: '/src/assets/images/novel_cover_whispering_canopy_1792815709554.jpg',
    genres: ['Botanical Fantasy', 'Literary Fiction', 'Mystery'],
    status: 'ongoing',
    available_languages: ['en', 'jp', 'hi'],
    is_featured: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-10-20T14:30:00Z',
    translations: {
      jp: {
        title: '囁く天蓋の書架',
        synopsis: '古代の巨樹の根元に眠る忘れられた書庫。すべての葉が天の下で囁かれた言葉を記憶している。若き学徒が古の暗号を解読したとき、静寂の森が目覚め始める。'
      },
      hi: {
        title: 'सरगोशियों की छतरी',
        synopsis: 'घने प्राचीन जंगल के बीच एक ऐसी पुस्तकालय है जिसके पत्ते दुनिया के हर अनकहे सच को याद रखते हैं। जब एक खोजी पुराने नक्शे की पहेली सुलझाती है, तो जड़ों में हलचल शुरू होती है।'
      }
    }
  },
  {
    id: 'nov-2',
    slug: 'blade-of-the-jade-lotus',
    title: 'Blade of the Jade Lotus',
    synopsis: 'In a mist-shrouded river sanctuary where lotus blossoms bloom with emerald embers, an exiled swordsmith must forge a blade capable of cutting through lingering illusions before the autumn rains flood the valley.',
    author: 'Kairo Tanaka',
    cover_url: '/src/assets/images/novel_cover_jade_lotus_1792815711079.jpg',
    genres: ['High Fantasy', 'Martial Arts', 'Philosophical'],
    status: 'ongoing',
    available_languages: ['en', 'jp'],
    is_featured: false,
    created_at: '2026-04-12T08:00:00Z',
    updated_at: '2026-10-18T16:00:00Z',
    translations: {
      jp: {
        title: '翡翠蓮の剣',
        synopsis: '霧深い聖域に咲く翡翠の蓮。追放された刀匠は、幻影を断ち切る唯一の刃を鍛えねばならない。秋の長雨が谷を満たす前に。'
      }
    }
  },
  {
    id: 'nov-3',
    slug: 'apothecary-of-the-forgotten-ward',
    title: 'Apothecary of the Forgotten Ward',
    synopsis: 'Tucked down an unmapped cobblestone alley in old Tokyo, a gentle herbalist brews remedies for ailments that medicine cannot name: phantom homesickness, the weight of forgotten promises, and memories left behind in old raincoats.',
    author: 'Satsuki Tanaka',
    cover_url: '/src/assets/images/novel_cover_tokyo_apothecary_1792815712119.jpg',
    genres: ['Slice of Life', 'Urban Fantasy', 'Healing'],
    status: 'ongoing',
    available_languages: ['en', 'jp'],
    is_featured: false,
    created_at: '2026-05-18T12:00:00Z',
    updated_at: '2026-10-22T09:15:00Z',
    translations: {
      jp: {
        title: '忘れられた街区の調剤薬局',
        synopsis: '地図にない路地の奥、木造の古い薬舗で、言葉にできない心の痛みを癒す処方箋を調合する薬師の静謐な日々の物語。'
      }
    }
  },
  {
    id: 'nov-4',
    slug: 'monsoon-memories',
    title: 'Monsoon Memories',
    synopsis: 'A heartfelt journey through an ancestral courtyard house in Kerala. Amidst the drumming of continuous rain, steam from cardamom tea, and handwritten diaries discovered inside an old rosewood chest, decades of quiet romance unveil.',
    author: 'Ananya Sharma',
    cover_url: '/src/assets/images/novel_cover_monsoon_rain_1792815711515.jpg',
    genres: ['Literary Fiction', 'Romance', 'Magical Realism'],
    status: 'ongoing',
    available_languages: ['en', 'hi'],
    is_featured: false,
    created_at: '2026-06-01T09:00:00Z',
    updated_at: '2026-10-15T18:45:00Z',
    translations: {
      hi: {
        title: 'मॉनसून मेमोरीज',
        synopsis: 'केरल के एक पुराने आंगन में बारिश की बूंदों और इलायची वाली चाय के बीच, संदूक में रखी पुरानी डायरियों से सामने आती है एक अनकही प्रेम कहानी।'
      }
    }
  }
];

const SEED_CHAPTERS: Chapter[] = [
  {
    id: 'ch-1',
    novel_id: 'nov-1',
    novel_slug: 'the-whispering-canopy',
    chapter_number: 1,
    order_index: 1,
    title: 'The Ink of Falling Lichen',
    slug: 'the-ink-of-falling-lichen',
    status: 'published',
    language: 'en',
    published_at: '2026-03-05T12:00:00Z',
    created_at: '2026-03-02T10:00:00Z',
    word_count: 1420,
    body: `The canopy was never truly silent. Even before sunrise, when mist clung to the ribbed bark of the iron-oaks like damp linen, the respiration of the forest made a sound like a distant sea.

Sylvia adjusted the brass strap of her field journal. Her boots sank an inch into the spongy carpet of emerald moss. Here, forty leagues north of the High Chancellor's road, the map ended in a smudge of pale green watercolor labeled simply: *The Unmeasured Arbor.*

"You hold your quill too tightly," Master Corvin murmured from three paces ahead. He did not look back. His hazel staff tapped each root with rhythmic care, testing the patience of the ancient wood. "The parchment must receive the ink, Sylvia, not be wounded by it."

"I am checking the humidity indicators, Master," she replied. She held up the small glass ampoule tucked into her sleeve. The powdered fern spores within had turned a faint violet—a certain sign of high ethereal saturation. "If the moisture rises another tenth, the cipher leaves on the third tier will begin to seal themselves shut."

Corvin paused before a colossal trunk whose circumference surpassed ten paces. The bark curled in spiraling ribbons, revealing pale luminous veins beneath that glowed with the subdued luster of polished jade.

"Then we climb," the old archivist said.

High above them, winding stairs carved straight from the living bheartwood wound upward toward the first lantern-bridge. From the leafy vaults descended the scent of wet elderflower and centuries-old dried parchment—the unmistakable signature of the Whispering Canopy. Every shelf here was grown rather than built, its books cradled in natural hollows of vine and cedar.

Sylvia took her first step onto the spiral stair. As her sole touched the damp timber, she felt the faint vibration: words, murmured in languages centuries dead, humming through the fibers of the tree.`,
    translations: {
      jp: {
        title: '第1章：落ちる地衣類のインク',
        body: '天蓋は真の静寂を知らなかった。夜明け前、霧が鉄樫の畝状の樹皮に湿った亜麻布のようにまとわりつく頃でさえ、森の呼吸は遥かな海の響きのように聞こえた。\n\nシルヴィアは真鍮の留め具を締め直した。深緑の苔の絨毯にブーツが沈む。大公の街道から北へ四十里、地図はただ「未踏の樹林」と淡い緑の絵の具で記された余白で終わっていた。\n\n「ペンを強く握りすぎだ」と、三歩先を行くコルヴィン師が呟いた。\n\n二人の頭上、生きた心材から削り出された螺旋階段が、最初の吊り橋へと続いていた。湿ったニワトコの花と数世紀前の羊皮紙の匂いが漂う——囁く天蓋の書架の証だった。'
      },
      hi: {
        title: 'अध्याय १: गिरती काई की स्याही',
        body: 'जंगल की छतरी कभी पूरी तरह शांत नहीं थी। सूरज उगने से पहले भी, जब कोहरा ओक के दरख्तों पर भीगे कपड़े की तरह लिपटा रहता, जंगल की सांसें किसी दूर के समंदर जैसी सुनाई देती थीं।\n\nसिल्विया ने अपनी डायरी का पीतल का बक्कल कसा। उसके जूते नर्म हरी काई में धंस रहे थे। नक्शा यहाँ आकर खत्म हो जाता था।\n\n"तुम कलम बहुत कसकर पकड़ती हो, सिल्विया," कोर्विन ने आगे बढ़ते हुए कहा। "कागज़ पर स्याही उतरनी चाहिए, चोट नहीं।"\n\nपेड़ के तने के अंदर से घुमावदार सीढ़ियां ऊपर जा रही थीं। जैसे ही सिल्विया ने पहला कदम रखा, उसे तने की रगों में सदियों पुरानी आवाज़ों की गूंज महसूस हुई।'
      }
    }
  },
  {
    id: 'ch-2',
    novel_id: 'nov-1',
    novel_slug: 'the-whispering-canopy',
    chapter_number: 2,
    order_index: 2,
    title: 'The Lexicon of Roots',
    slug: 'the-lexicon-of-roots',
    status: 'published',
    language: 'en',
    published_at: '2026-03-18T15:00:00Z',
    created_at: '2026-03-12T14:00:00Z',
    word_count: 1680,
    body: `The third tier of the library hung suspended seventy cubits above the forest floor. Sunlight filtered through the dense foliage like coins scattered across green velvet.

"Observe the margin notes," Corvin said, laying his palm flat against a folio made of compressed mulberry bark. "The scribe did not use iron-gall. This is elderberry sap tempered with morning frost."

Sylvia leaned closer. The text was composed in the Old High script of the Riverfolk—graceful, curving glyphs that resembled reed stalks bending beneath an evening current.

"It speaks of a covenant," she whispered, translating aloud. "'When the ninth moon crosses the horn of the Elk, let the watergate be raised, for the sap-tides will not tarry for kingdoms or kings.'"

A quiet rustle stirred the leaves above them. A bird with plumage the color of smoked amber cocked its head from a nearby branch, watching the open folio with unblinking curiosity.

"Corvin," Sylvia murmured, "the ink is still wet."

The old scholar stiffened. He lifted his fingertip from the page. A faint smudge of iridescent black clung to his skin, warm to the touch.

"We are not the only ones reading here today," he whispered softly. "Close the case, Sylvia. And do not make a sound."`,
    translations: {
      jp: {
        title: '第2章：根の語彙集',
        body: '書庫の第三層は、林床から七十キュービットの高さに吊り下げられていた。緑のビロードに散らばる金貨のように、木漏れ日が差し込む。\n\n「欄外の注釈を見なさい」とコルヴィンが言った。「鉄没食子インクではない。朝露で練られたニワトコの実の樹液だ」\n\n「インクがまだ湿っています」シルヴィアが息を呑んだ。コルヴィンの指先に、温もりを帯びた黒い染みが付着していた。\n\n「今日ここで読書をしているのは、我々だけではないようだ」老学徒は低く囁いた。'
      },
      hi: {
        title: 'अध्याय २: जड़ों का शब्दकोश',
        body: 'पुस्तकालय की तीसरी मंजिल जमीन से काफी ऊंचाई पर झूल रही थी। घनी पत्तियों से छनकर आती धूप ऐसी लग रही थी जैसे मखमली कालीन पर सिक्के बिखरे हों।\n\n"किनारे लिखे नोट देखो," कोर्विन ने एक पुराने पन्ने पर हाथ रखकर कहा।\n\nसिल्विया ने झुककर देखा। "कोर्विन... स्याही अभी भी गीली है।"\n\nकोर्विन ठहर गया। उसकी उंगली पर हल्की सी ताज़ा स्याही लग गई थी।\n\n"आज इस जंगल में सिर्फ हम अकेले नहीं पढ़ रहे," उसने धीरे से कहा।'
      }
    }
  },
  {
    id: 'ch-3',
    novel_id: 'nov-1',
    novel_slug: 'the-whispering-canopy',
    chapter_number: 3,
    order_index: 3,
    title: 'The Cartographer’s Shadow',
    slug: 'the-cartographers-shadow',
    status: 'published',
    language: 'en',
    published_at: '2026-10-15T09:00:00Z',
    created_at: '2026-10-14T08:00:00Z',
    word_count: 1550,
    body: `Shadows in Vael-Thorn were not mere absences of light; they possessed weight, texture, and a peculiar coolness that settled like river water upon bare skin.

Behind the third shelf of botanical herbalism, Sylvia caught the glimpse of a dark hooded mantle slipping between the twisted roots.

"Who travels the archives unannounced?" she called out, her voice crisp and steady despite the rapid pounding of her pulse.

The figure stopped. A gloved hand rested upon a carved balustrade. When the stranger spoke, the voice was melodic yet worn by long years of solitude.

"The map was never meant to show where to go, child," the traveler said. "It was drawn to show what we must never return to."

In his outstretched palm rested a brass compass, its needle pointing not toward magnetic north, but steadily upward toward the crowning star-leaf of the great canopy.`,
    translations: {
      jp: {
        title: '第3章：地図師の影',
        body: '樹海における影は単なる光の欠如ではない。重みと質感、そして肌に川水のように染み渡る独特の冷涼さを持っていた。\n\n「どなたですか？」シルヴィアが声を張り上げた。マントの人物が立ち止まる。\n\n「この地図は行くべき場所を示すためのものではない」旅人は言った。「二度と戻ってはならぬ場所を記したものだ」'
      }
    }
  },
  {
    id: 'ch-4',
    novel_id: 'nov-2',
    novel_slug: 'blade-of-the-jade-lotus',
    chapter_number: 1,
    order_index: 1,
    title: 'Mist Over the Weeping Willows',
    slug: 'mist-over-the-weeping-willows',
    status: 'published',
    language: 'en',
    published_at: '2026-04-15T10:00:00Z',
    created_at: '2026-04-12T08:00:00Z',
    word_count: 1380,
    body: `The river ran jade under the morning fog.

On the flat river stone, the crucible burned low. Ren stroked the cooling steel with a damp horsehair brush. Every master smith had warned him: folding jade ore into river-tempered steel was foolishness. The minerals would shatter under the hammer, leaving nothing but glittering dust.

Yet when the sun breached the willow crests, the surface of the blade did not fracture. It shimmered with an emerald grain that seemed to breathe with the rhythm of the water.

"A blade that cuts not flesh, but intention," Ren murmured to himself. Across the reed banks, the bell of the mountain shrine chimed three times.`
  },
  {
    id: 'ch-5',
    novel_id: 'nov-3',
    novel_slug: 'apothecary-of-the-forgotten-ward',
    chapter_number: 1,
    order_index: 1,
    title: 'Tinctures for Rainy Afternoons',
    slug: 'tinctures-for-rainy-afternoons',
    status: 'published',
    language: 'en',
    published_at: '2026-05-20T14:00:00Z',
    created_at: '2026-05-18T10:00:00Z',
    word_count: 1290,
    body: `The brass bell above the sliding paper door gave a soft chime.

Outside, the late June rain poured steadily onto the stone pavement of the alley. Inside the apothecary, the air was warm with dried chamomile, wild mint, and the faint resinous scent of cedar wood.

"Welcome," Satsuki said without looking up from her mortar and pestle. She was grinding dried silver-fir needles into a fine, fragrant powder. "If you are soaked through, there is a dry towel on the bamboo rack beside the umbrella stand."

A young woman in a drenched trench coat stepped inside, hesitating as her umbrella dripped onto the stone threshold.

"I... I was told someone here could help with a headache," the visitor said quietly. "Though the doctors at the hospital say nothing is wrong with me."

Satsuki set down her pestle. She looked at the visitor's pale face, noting the faint blue rings under her eyes and the way her fingers clutched an old train ticket.

"Hospital doctors treat what is present," Satsuki said gently, pouring hot water from a cast iron kettle over a blend of roasted barley and dried pear blossom. "Here, we treat what is missing. Come, sit by the brazier."`
  },
  {
    id: 'ch-6',
    novel_id: 'nov-4',
    novel_slug: 'monsoon-memories',
    chapter_number: 1,
    order_index: 1,
    title: 'Rain on Terracotta Tiles',
    slug: 'rain-on-terracotta-tiles',
    status: 'published',
    language: 'en',
    published_at: '2026-06-05T11:00:00Z',
    created_at: '2026-06-01T09:00:00Z',
    word_count: 1460,
    body: `The first monsoon drops in Wayanad always arrive like scattered applause.

Maya sat on the wooden swing suspended from the heavy teak rafters of the ancestral courtyard. The scent of dry red clay greeting the first deluge rose through the veranda—*petrichor*, her grandfather used to call it with a slow nod, though in Malayalam he simply called it *manninte gandham*, the smell of the earth remembering its bloodline.

On the low wooden bench lay the leather-bound journal she had unearthed that morning from the attic chest. Its yellowed pages were edged in faint watermarks.

"Maya-kutty, tea," her aunt called from the kitchen doorway, holding a smoking brass glass of cardamom chai. "Don't sit out where the spray reaches. You'll catch a chill before dinner."

Maya smiled, taking the warm brass glass between both palms. She opened the journal to page twenty-four. Written in graceful indigo cursive was a line dated July 14, 1968:

*'If you are reading this while the rain drums on the courtyard tiles, know that some promises are not broken by silence.'*`
  }
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Akhyana: Forest Quiet Editorial Edition',
    message: 'We have redesigned Akhyana with a calm, literary reading experience inspired by ancient arboreal libraries. Explore new chapters in Hinglish, English, and Japanese.',
    type: 'general',
    action_label: 'Explore Stories ↗',
    action_url: '#explore',
    status: 'published',
    created_at: '2026-10-20T00:00:00Z',
    expires_at: '2026-12-31T23:59:59Z'
  },
  {
    id: 'ann-2',
    title: 'New Chapter: The Whispering Canopy — Chapter 3',
    message: 'Sylvia encounters a mysterious hooded cartographer holding a compass that points directly upward into the sky. Read Chapter 3 now.',
    type: 'chapter_release',
    action_label: 'Read Chapter 3',
    action_url: '/novel/the-whispering-canopy/chapter/the-cartographers-shadow',
    status: 'published',
    created_at: '2026-10-22T08:00:00Z',
    expires_at: '2026-11-20T23:59:59Z'
  }
];

const SEED_COMMENTS: Comment[] = [
  {
    id: 'com-1',
    novel_id: 'nov-1',
    novel_slug: 'the-whispering-canopy',
    author_name: 'Mira S.',
    content: 'The description of the tree roots humming with old words gave me absolute chills. The atmosphere is so peaceful yet brimming with ancient wonder.',
    status: 'approved',
    created_at: '2026-10-21T14:20:00Z'
  },
  {
    id: 'com-2',
    novel_id: 'nov-1',
    novel_slug: 'the-whispering-canopy',
    author_name: 'Kazuhiro',
    content: '日本語の翻訳も非常に美しく整えられていて感動しました。次章を楽しみに待っています！',
    status: 'approved',
    created_at: '2026-10-22T11:45:00Z'
  },
  {
    id: 'com-3',
    novel_id: 'nov-4',
    novel_slug: 'monsoon-memories',
    author_name: 'Devika P.',
    content: 'The courtyard imagery took me right back to my grandparents’ ancestral home during July storms. Beautifully written.',
    status: 'approved',
    created_at: '2026-10-22T16:10:00Z'
  }
];

const SEED_SETTINGS: SiteSettings = {
  site_name: 'Akhyana',
  tagline: 'Stories that stay with you.',
  featured_novel_slug: 'the-whispering-canopy',
  accent_color: '#B08D46',
  footer_text: '© Akhyana. Original literary works, web fiction & translations. All rights reserved.',
  allow_comments: true,
  announcement_popup_enabled: true
};

const SEED_ADMINS: AdminUser[] = [
  {
    id: 'usr-owner-1',
    email: process.env.OWNER_EMAIL || 'owner@akhyana.lit',
    name: 'Akhyana Owner',
    role: 'owner',
    password_hash: process.env.OWNER_PASSWORD_HASH || DEFAULT_HASH,
    created_at: '2026-01-01T00:00:00Z'
  }
];

class DatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadInitial();
  }

  private loadInitial(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure defaults if missing keys
        return {
          novels: parsed.novels || SEED_NOVELS,
          chapters: parsed.chapters || SEED_CHAPTERS,
          announcements: parsed.announcements || SEED_ANNOUNCEMENTS,
          reading_progress: parsed.reading_progress || [],
          comments: parsed.comments || SEED_COMMENTS,
          admins: parsed.admins || SEED_ADMINS,
          settings: parsed.settings || SEED_SETTINGS
        };
      }
    } catch (err) {
      console.warn('Failed to read db file, using seed state:', err);
    }

    const state: DatabaseState = {
      novels: SEED_NOVELS,
      chapters: SEED_CHAPTERS,
      announcements: SEED_ANNOUNCEMENTS,
      reading_progress: [],
      comments: SEED_COMMENTS,
      admins: SEED_ADMINS,
      settings: SEED_SETTINGS
    };
    this.persist(state);
    return state;
  }

  private persist(state: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public getNovels(): Novel[] {
    return this.state.novels;
  }

  public getNovelBySlug(slug: string): Novel | undefined {
    return this.state.novels.find(n => n.slug === slug || n.id === slug);
  }

  public saveNovel(novel: Novel): Novel {
    const existingIndex = this.state.novels.findIndex(n => n.id === novel.id || n.slug === novel.slug);
    if (existingIndex >= 0) {
      this.state.novels[existingIndex] = { ...this.state.novels[existingIndex], ...novel, updated_at: new Date().toISOString() };
    } else {
      this.state.novels.unshift(novel);
    }
    this.persist(this.state);
    return novel;
  }

  public deleteNovel(id: string): boolean {
    const prevLen = this.state.novels.length;
    this.state.novels = this.state.novels.filter(n => n.id !== id && n.slug !== id);
    this.state.chapters = this.state.chapters.filter(c => c.novel_id !== id && c.novel_slug !== id);
    this.persist(this.state);
    return this.state.novels.length < prevLen;
  }

  public getChapters(novelSlugOrId?: string, includeDrafts: boolean = false): Chapter[] {
    let list = this.state.chapters;
    if (novelSlugOrId) {
      list = list.filter(c => c.novel_slug === novelSlugOrId || c.novel_id === novelSlugOrId);
    }
    if (!includeDrafts) {
      list = list.filter(c => c.status === 'published');
    }
    return list.sort((a, b) => a.order_index - b.order_index);
  }

  public getChapter(identifier: string, novelSlug?: string): Chapter | undefined {
    return this.state.chapters.find(c => {
      const idMatch = c.id === identifier || c.slug === identifier;
      if (novelSlug) {
        return idMatch && (c.novel_slug === novelSlug || c.novel_id === novelSlug);
      }
      return idMatch;
    });
  }

  public saveChapter(chapter: Chapter): Chapter {
    const existingIndex = this.state.chapters.findIndex(c => c.id === chapter.id);
    if (existingIndex >= 0) {
      this.state.chapters[existingIndex] = { ...this.state.chapters[existingIndex], ...chapter };
    } else {
      this.state.chapters.push(chapter);
    }
    this.persist(this.state);
    return chapter;
  }

  public deleteChapter(id: string): boolean {
    const prevLen = this.state.chapters.length;
    this.state.chapters = this.state.chapters.filter(c => c.id !== id && c.slug !== id);
    this.persist(this.state);
    return this.state.chapters.length < prevLen;
  }

  public getAnnouncements(publicOnly: boolean = true): Announcement[] {
    if (!publicOnly) return this.state.announcements;
    const now = new Date().toISOString();
    return this.state.announcements.filter(a => {
      if (a.status !== 'published') return false;
      if (a.expires_at && a.expires_at < now) return false;
      return true;
    });
  }

  public saveAnnouncement(announcement: Announcement): Announcement {
    const idx = this.state.announcements.findIndex(a => a.id === announcement.id);
    if (idx >= 0) {
      this.state.announcements[idx] = announcement;
    } else {
      this.state.announcements.unshift(announcement);
    }
    this.persist(this.state);
    return announcement;
  }

  public deleteAnnouncement(id: string): boolean {
    const prevLen = this.state.announcements.length;
    this.state.announcements = this.state.announcements.filter(a => a.id !== id);
    this.persist(this.state);
    return this.state.announcements.length < prevLen;
  }

  public getReadingProgress(readerId: string): ReadingProgress[] {
    return this.state.reading_progress.filter(rp => rp.reader_id === readerId);
  }

  public saveReadingProgress(rp: ReadingProgress): ReadingProgress {
    const idx = this.state.reading_progress.findIndex(
      item => item.reader_id === rp.reader_id && item.novel_slug === rp.novel_slug
    );
    if (idx >= 0) {
      this.state.reading_progress[idx] = rp;
    } else {
      this.state.reading_progress.unshift(rp);
    }
    this.persist(this.state);
    return rp;
  }

  public getNewChapterAlerts(readerId: string) {
    const progressList = this.getReadingProgress(readerId);
    const alerts: Array<{
      novel: Novel;
      latestChapter: Chapter;
      lastReadChapterNumber: number;
    }> = [];

    for (const prog of progressList) {
      const novel = this.getNovelBySlug(prog.novel_slug);
      if (!novel) continue;
      const chapters = this.getChapters(novel.slug, false);
      if (chapters.length === 0) continue;
      const latest = chapters[chapters.length - 1];
      if (latest.chapter_number > prog.last_chapter_number) {
        alerts.push({
          novel,
          latestChapter: latest,
          lastReadChapterNumber: prog.last_chapter_number
        });
      }
    }
    return alerts;
  }

  public getComments(novelSlug: string): Comment[] {
    return this.state.comments.filter(c => c.novel_slug === novelSlug && c.status === 'approved');
  }

  public getAllComments(): Comment[] {
    return this.state.comments;
  }

  public addComment(comment: Comment): Comment {
    this.state.comments.unshift(comment);
    this.persist(this.state);
    return comment;
  }

  public updateCommentStatus(id: string, status: 'approved' | 'hidden'): boolean {
    const c = this.state.comments.find(item => item.id === id);
    if (c) {
      c.status = status;
      this.persist(this.state);
      return true;
    }
    return false;
  }

  public deleteComment(id: string): boolean {
    const prev = this.state.comments.length;
    this.state.comments = this.state.comments.filter(c => c.id !== id);
    this.persist(this.state);
    return this.state.comments.length < prev;
  }

  public getSettings(): SiteSettings {
    return this.state.settings;
  }

  public updateSettings(settings: Partial<SiteSettings>): SiteSettings {
    this.state.settings = { ...this.state.settings, ...settings };
    this.persist(this.state);
    return this.state.settings;
  }

  public getAdmins(): AdminUser[] {
    return this.state.admins;
  }

  public findAdminByEmail(email: string): AdminUser | undefined {
    return this.state.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  public addAdmin(admin: AdminUser): AdminUser {
    this.state.admins.push(admin);
    this.persist(this.state);
    return admin;
  }

  public deleteAdmin(id: string): boolean {
    if (this.state.admins.length <= 1) return false;
    this.state.admins = this.state.admins.filter(a => a.id !== id && a.role !== 'owner');
    this.persist(this.state);
    return true;
  }
}

export const db = new DatabaseManager();
