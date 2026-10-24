import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Pool } = pg;

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
  chapter_slug?: string;
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

// PostgreSQL connection pool (activated when DATABASE_URL is configured)
const pgPool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    })
  : null;

class DatabaseManager {
  private state: DatabaseState;
  private pgInitialized: boolean = false;

  constructor() {
    this.state = this.loadInitial();
    this.initPostgreSQLSync();
  }

  private async initPostgreSQLSync() {
    if (!pgPool) return;
    try {
      // Test connectivity and load persisted records if available
      const testRes = await pgPool.query('SELECT 1 FROM novels LIMIT 1').catch(() => null);
      if (testRes) {
        console.log('[PostgreSQL] Connection established. Hydrating active state from PostgreSQL...');
        const [novelsRes, chaptersRes, announcementsRes, commentsRes, adminsRes] = await Promise.all([
          pgPool.query('SELECT * FROM novels ORDER BY created_at DESC'),
          pgPool.query('SELECT * FROM chapters ORDER BY chapter_number ASC'),
          pgPool.query('SELECT * FROM announcements ORDER BY created_at DESC'),
          pgPool.query('SELECT * FROM comments ORDER BY created_at DESC'),
          pgPool.query('SELECT * FROM admin_users ORDER BY created_at ASC')
        ]);

        if (novelsRes.rows.length > 0) {
          this.state.novels = novelsRes.rows.map(r => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            synopsis: r.synopsis,
            author: r.author,
            cover_url: r.cover_url,
            genres: r.genres || [],
            status: r.status,
            available_languages: r.available_languages || ['en'],
            is_featured: !!r.is_featured,
            translations: typeof r.translations === 'string' ? JSON.parse(r.translations) : (r.translations || {}),
            created_at: r.created_at,
            updated_at: r.updated_at
          }));
        }

        if (chaptersRes.rows.length > 0) {
          this.state.chapters = chaptersRes.rows.map(r => ({
            id: r.id,
            novel_id: r.novel_id,
            novel_slug: r.novel_slug,
            chapter_number: r.chapter_number,
            order_index: r.order_index,
            title: r.title,
            slug: r.slug,
            body: r.body,
            language: r.language,
            status: r.status,
            cover_url: r.cover_url || null,
            published_at: r.published_at,
            created_at: r.created_at,
            word_count: r.word_count || 0,
            translations: typeof r.translations === 'string' ? JSON.parse(r.translations) : (r.translations || {})
          }));
        }

        if (announcementsRes.rows.length > 0) {
          this.state.announcements = announcementsRes.rows.map(r => ({
            id: r.id,
            title: r.title,
            message: r.message,
            type: r.type,
            action_label: r.action_label,
            action_url: r.action_url,
            image_url: r.image_url,
            status: r.status,
            created_at: r.created_at,
            expires_at: r.expires_at
          }));
        }

        if (commentsRes.rows.length > 0) {
          this.state.comments = commentsRes.rows.map(r => ({
            id: r.id,
            novel_id: r.novel_id,
            novel_slug: r.novel_slug,
            author_name: r.author_name,
            content: r.content,
            status: r.status,
            created_at: r.created_at
          }));
        }

        if (adminsRes.rows.length > 0) {
          this.state.admins = adminsRes.rows.map(r => ({
            id: r.id,
            email: r.email,
            name: r.name,
            role: r.role,
            password_hash: r.password_hash,
            created_at: r.created_at
          }));
        }
        this.persist(this.state);
        console.log('[PostgreSQL] State hydrated successfully from PostgreSQL.');
      } else {
        // If table doesn't have data, seed current state into PostgreSQL
        console.log('[PostgreSQL] Connected. Database tables empty; seeding initial records...');
        await this.syncAllToPostgreSQL();
      }
      this.pgInitialized = true;
    } catch (err: any) {
      console.warn('[PostgreSQL] Hydration notice (continuing with persistent local store):', err.message);
    }
  }

  private async syncAllToPostgreSQL() {
    if (!pgPool) return;
    try {
      for (const n of this.state.novels) {
        await pgPool.query(
          `INSERT INTO novels (id, slug, title, synopsis, author, cover_url, genres, status, available_languages, is_featured, translations, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, synopsis = EXCLUDED.synopsis, updated_at = EXCLUDED.updated_at`,
          [n.id, n.slug, n.title, n.synopsis, n.author, n.cover_url, n.genres, n.status, n.available_languages, n.is_featured, JSON.stringify(n.translations || {}), n.created_at, n.updated_at]
        );
      }
      for (const a of this.state.admins) {
        await pgPool.query(
          `INSERT INTO admin_users (id, email, name, role, password_hash, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [a.id, a.email, a.name, a.role, a.password_hash, a.created_at]
        );
      }
      for (const c of this.state.chapters) {
        await pgPool.query(
          `INSERT INTO chapters (id, novel_id, novel_slug, chapter_number, order_index, title, slug, body, language, status, word_count, published_at, translations, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [c.id, c.novel_id, c.novel_slug, c.chapter_number, c.order_index, c.title, c.slug, c.body, c.language, c.status, c.word_count, c.published_at, JSON.stringify(c.translations || {}), c.created_at]
        );
      }
    } catch (err: any) {
      console.warn('[PostgreSQL] Initial sync notice:', err.message);
    }
  }

  private loadInitial(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          novels: (parsed.novels || SEED_NOVELS).filter((n: any) => n && n.id && n.slug),
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
    if (!slug) return undefined;
    const clean = decodeURIComponent(slug).trim().toLowerCase();
    return this.state.novels.find(n =>
      (n.slug && n.slug.toLowerCase() === clean) ||
      (n.id && n.id.toLowerCase() === clean)
    );
  }

  public getNovelById(id: string): Novel | undefined {
    if (!id) return undefined;
    return this.state.novels.find(n => n.id === id);
  }

  public saveNovel(novel: Partial<Novel> & { title: string; slug: string }, originalSlugOrId?: string): Novel {
    const cleanSlug = novel.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    let existingIndex = -1;

    if (originalSlugOrId) {
      const targetOriginal = decodeURIComponent(originalSlugOrId).trim().toLowerCase();
      existingIndex = this.state.novels.findIndex(
        n => n.slug.toLowerCase() === targetOriginal || n.id.toLowerCase() === targetOriginal
      );
    }
    if (existingIndex < 0 && novel.id) {
      existingIndex = this.state.novels.findIndex(n => n.id === novel.id);
    }
    if (existingIndex < 0 && cleanSlug) {
      existingIndex = this.state.novels.findIndex(n => n.slug.toLowerCase() === cleanSlug);
    }

    let savedNovel: Novel;
    if (existingIndex >= 0) {
      const prev = this.state.novels[existingIndex];
      const prevSlug = prev.slug;
      savedNovel = {
        ...prev,
        ...novel,
        id: prev.id, // Preserve immutable ID
        slug: cleanSlug || prev.slug,
        title: (novel.title || prev.title).trim(),
        updated_at: new Date().toISOString()
      };
      this.state.novels[existingIndex] = savedNovel;

      // Cascade novel_slug updates to associated chapters
      if (prevSlug && prevSlug !== savedNovel.slug) {
        for (const ch of this.state.chapters) {
          if (ch.novel_slug === prevSlug || ch.novel_id === prev.id) {
            ch.novel_slug = savedNovel.slug;
          }
        }
      }
    } else {
      const newId = novel.id || ('nov-' + Date.now());
      savedNovel = {
        id: newId,
        slug: cleanSlug,
        title: novel.title.trim(),
        synopsis: novel.synopsis || '',
        author: novel.author || 'Akhyana Staff',
        cover_url: novel.cover_url || '/src/assets/images/novel_cover_whispering_canopy_1792815709554.jpg',
        genres: novel.genres || ['Literary Fiction'],
        status: novel.status || 'ongoing',
        available_languages: novel.available_languages || ['en'],
        is_featured: !!novel.is_featured,
        created_at: novel.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translations: novel.translations || {}
      };
      this.state.novels.unshift(savedNovel);
    }
    this.persist(this.state);

    if (pgPool) {
      pgPool.query(
        `INSERT INTO novels (id, slug, title, synopsis, author, cover_url, genres, status, available_languages, is_featured, translations, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           synopsis = EXCLUDED.synopsis,
           author = EXCLUDED.author,
           cover_url = EXCLUDED.cover_url,
           genres = EXCLUDED.genres,
           status = EXCLUDED.status,
           available_languages = EXCLUDED.available_languages,
           is_featured = EXCLUDED.is_featured,
           translations = EXCLUDED.translations,
           updated_at = EXCLUDED.updated_at`,
        [
          savedNovel.id,
          savedNovel.slug,
          savedNovel.title,
          savedNovel.synopsis,
          savedNovel.author,
          savedNovel.cover_url,
          savedNovel.genres,
          savedNovel.status,
          savedNovel.available_languages,
          savedNovel.is_featured,
          JSON.stringify(savedNovel.translations || {}),
          savedNovel.created_at,
          savedNovel.updated_at
        ]
      ).catch(err => console.error('[PostgreSQL] saveNovel error:', err.message));
    }

    return savedNovel;
  }

  public deleteNovel(idOrSlug: string): boolean {
    const target = this.getNovelBySlug(idOrSlug) || this.getNovelById(idOrSlug);
    if (!target) return false;
    const { id, slug } = target;

    const prevLen = this.state.novels.length;
    this.state.novels = this.state.novels.filter(n => n.id !== id && n.slug !== slug);
    // Cascade delete chapters, comments, and reading progress
    this.state.chapters = this.state.chapters.filter(c => c.novel_id !== id && c.novel_slug !== slug);
    this.state.comments = this.state.comments.filter(c => c.novel_id !== id && c.novel_slug !== slug);
    this.state.reading_progress = this.state.reading_progress.filter(r => r.novel_id !== id && r.novel_slug !== slug);
    this.persist(this.state);

    if (pgPool) {
      pgPool.query('DELETE FROM novels WHERE id = $1 OR slug = $2', [id, slug])
        .catch(err => console.error('[PostgreSQL] deleteNovel error:', err.message));
    }

    return this.state.novels.length < prevLen;
  }

  public getChapters(novelSlugOrId?: string, includeDrafts: boolean = false): Chapter[] {
    let list = this.state.chapters;
    if (novelSlugOrId) {
      const clean = decodeURIComponent(novelSlugOrId).trim().toLowerCase();
      list = list.filter(c =>
        (c.novel_slug && c.novel_slug.toLowerCase() === clean) ||
        (c.novel_id && c.novel_id.toLowerCase() === clean)
      );
    }
    if (!includeDrafts) {
      list = list.filter(c => c.status === 'published');
    }
    return list.sort((a, b) => a.order_index - b.order_index);
  }

  public getChapter(identifier: string, novelSlug?: string): Chapter | undefined {
    if (!identifier) return undefined;
    const cleanId = decodeURIComponent(identifier).trim().toLowerCase();
    const cleanNovel = novelSlug ? decodeURIComponent(novelSlug).trim().toLowerCase() : undefined;

    return this.state.chapters.find(c => {
      const idMatch = (c.id && c.id.toLowerCase() === cleanId) || (c.slug && c.slug.toLowerCase() === cleanId);
      if (cleanNovel) {
        return idMatch && ((c.novel_slug && c.novel_slug.toLowerCase() === cleanNovel) || (c.novel_id && c.novel_id.toLowerCase() === cleanNovel));
      }
      return idMatch;
    });
  }

  public saveChapter(chapter: Partial<Chapter> & { novel_slug: string; title: string }): Chapter {
    const cleanSlug = (chapter.slug || chapter.title.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')).trim();
    const novel = this.getNovelBySlug(chapter.novel_slug);
    const novelId = chapter.novel_id || novel?.id || ('nov-ref-' + chapter.novel_slug);

    let existingIndex = -1;
    if (chapter.id) {
      existingIndex = this.state.chapters.findIndex(c => c.id === chapter.id);
    }
    if (existingIndex < 0 && cleanSlug) {
      existingIndex = this.state.chapters.findIndex(c =>
        (c.novel_slug.toLowerCase() === chapter.novel_slug.toLowerCase() || c.novel_id === novelId) &&
        c.slug.toLowerCase() === cleanSlug.toLowerCase()
      );
    }

    let savedChapter: Chapter;
    if (existingIndex >= 0) {
      const prev = this.state.chapters[existingIndex];
      savedChapter = {
        ...prev,
        ...chapter,
        id: prev.id,
        novel_id: novelId,
        novel_slug: chapter.novel_slug || prev.novel_slug,
        title: chapter.title.trim(),
        slug: cleanSlug || prev.slug,
        body: chapter.body !== undefined ? chapter.body : prev.body,
        word_count: chapter.body !== undefined ? chapter.body.trim().split(/\s+/).filter(Boolean).length : prev.word_count
      };
      this.state.chapters[existingIndex] = savedChapter;
    } else {
      const newId = chapter.id || ('ch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5));
      const wordCount = chapter.body ? chapter.body.trim().split(/\s+/).filter(Boolean).length : 0;
      savedChapter = {
        id: newId,
        novel_id: novelId,
        novel_slug: chapter.novel_slug,
        chapter_number: chapter.chapter_number ?? (this.state.chapters.filter(c => c.novel_slug === chapter.novel_slug).length + 1),
        order_index: chapter.order_index ?? (chapter.chapter_number ?? 1),
        title: chapter.title.trim(),
        slug: cleanSlug,
        body: chapter.body || '',
        language: chapter.language || 'en',
        status: chapter.status || 'draft',
        cover_url: chapter.cover_url || null,
        published_at: chapter.status === 'published' ? (chapter.published_at || new Date().toISOString()) : null,
        created_at: chapter.created_at || new Date().toISOString(),
        word_count: wordCount,
        translations: chapter.translations || {}
      };
      this.state.chapters.push(savedChapter);
    }
    this.persist(this.state);

    if (pgPool) {
      pgPool.query(
        `INSERT INTO chapters (id, novel_id, novel_slug, chapter_number, order_index, title, slug, body, language, status, word_count, published_at, translations, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           novel_slug = EXCLUDED.novel_slug,
           chapter_number = EXCLUDED.chapter_number,
           order_index = EXCLUDED.order_index,
           title = EXCLUDED.title,
           slug = EXCLUDED.slug,
           body = EXCLUDED.body,
           language = EXCLUDED.language,
           status = EXCLUDED.status,
           word_count = EXCLUDED.word_count,
           published_at = EXCLUDED.published_at,
           translations = EXCLUDED.translations`,
        [
          savedChapter.id,
          savedChapter.novel_id,
          savedChapter.novel_slug,
          savedChapter.chapter_number,
          savedChapter.order_index,
          savedChapter.title,
          savedChapter.slug,
          savedChapter.body,
          savedChapter.language,
          savedChapter.status,
          savedChapter.word_count,
          savedChapter.published_at,
          JSON.stringify(savedChapter.translations || {}),
          savedChapter.created_at
        ]
      ).catch(err => console.error('[PostgreSQL] saveChapter error:', err.message));
    }

    return savedChapter;
  }

  public deleteChapter(id: string): boolean {
    const prevLen = this.state.chapters.length;
    this.state.chapters = this.state.chapters.filter(c => c.id !== id && c.slug !== id);
    this.persist(this.state);

    if (pgPool) {
      pgPool.query('DELETE FROM chapters WHERE id = $1 OR slug = $1', [id])
        .catch(err => console.error('[PostgreSQL] deleteChapter error:', err.message));
    }

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

  public saveAnnouncement(announcement: Partial<Announcement> & { title: string; message: string }): Announcement {
    const newId = announcement.id || ('ann-' + Date.now());
    const savedAnnouncement: Announcement = {
      id: newId,
      title: announcement.title.trim(),
      message: announcement.message.trim(),
      type: announcement.type || 'general',
      action_label: announcement.action_label || null,
      action_url: announcement.action_url || null,
      image_url: announcement.image_url || null,
      status: announcement.status || 'published',
      created_at: announcement.created_at || new Date().toISOString(),
      expires_at: announcement.expires_at || null
    };

    const idx = this.state.announcements.findIndex(a => a.id === savedAnnouncement.id);
    if (idx >= 0) {
      this.state.announcements[idx] = savedAnnouncement;
    } else {
      this.state.announcements.unshift(savedAnnouncement);
    }
    this.persist(this.state);

    if (pgPool) {
      pgPool.query(
        `INSERT INTO announcements (id, title, message, type, action_label, action_url, image_url, status, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           message = EXCLUDED.message,
           type = EXCLUDED.type,
           action_label = EXCLUDED.action_label,
           action_url = EXCLUDED.action_url,
           image_url = EXCLUDED.image_url,
           status = EXCLUDED.status,
           expires_at = EXCLUDED.expires_at`,
        [
          savedAnnouncement.id,
          savedAnnouncement.title,
          savedAnnouncement.message,
          savedAnnouncement.type,
          savedAnnouncement.action_label,
          savedAnnouncement.action_url,
          savedAnnouncement.image_url,
          savedAnnouncement.status,
          savedAnnouncement.created_at,
          savedAnnouncement.expires_at
        ]
      ).catch(err => console.error('[PostgreSQL] saveAnnouncement error:', err.message));
    }

    return savedAnnouncement;
  }

  public deleteAnnouncement(id: string): boolean {
    const prevLen = this.state.announcements.length;
    this.state.announcements = this.state.announcements.filter(a => a.id !== id);
    this.persist(this.state);

    if (pgPool) {
      pgPool.query('DELETE FROM announcements WHERE id = $1', [id])
        .catch(err => console.error('[PostgreSQL] deleteAnnouncement error:', err.message));
    }

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

    if (pgPool) {
      pgPool.query(
        `INSERT INTO reading_progress (reader_id, novel_id, novel_slug, last_chapter_id, last_chapter_number, progress_percent, last_read_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (reader_id, novel_id) DO UPDATE SET
           novel_slug = EXCLUDED.novel_slug,
           last_chapter_id = EXCLUDED.last_chapter_id,
           last_chapter_number = EXCLUDED.last_chapter_number,
           progress_percent = EXCLUDED.progress_percent,
           last_read_at = EXCLUDED.last_read_at`,
        [rp.reader_id, rp.novel_id, rp.novel_slug, rp.last_chapter_id, rp.last_chapter_number, rp.progress_percent, rp.last_read_at]
      ).catch(err => console.error('[PostgreSQL] saveReadingProgress error:', err.message));
    }

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
    const clean = decodeURIComponent(novelSlug).trim().toLowerCase();
    return this.state.comments.filter(c =>
      c.novel_slug.toLowerCase() === clean && c.status === 'approved'
    );
  }

  public getAllComments(): Comment[] {
    return this.state.comments;
  }

  public addComment(comment: Partial<Comment> & { novel_slug: string; author_name: string; content: string }): Comment {
    const novel = this.getNovelBySlug(comment.novel_slug);
    const savedComment: Comment = {
      id: comment.id || ('com-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)),
      novel_id: comment.novel_id || novel?.id || ('nov-ref-' + comment.novel_slug),
      novel_slug: comment.novel_slug,
      chapter_slug: comment.chapter_slug,
      author_name: comment.author_name.trim(),
      content: comment.content.trim(),
      status: comment.status || 'pending',
      created_at: comment.created_at || new Date().toISOString()
    };

    this.state.comments.unshift(savedComment);
    this.persist(this.state);

    if (pgPool) {
      pgPool.query(
        `INSERT INTO comments (id, novel_id, novel_slug, author_name, content, status, created_at, display_name, body, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $4, $5, $8)`,
        [savedComment.id, savedComment.novel_id, savedComment.novel_slug, savedComment.author_name, savedComment.content, savedComment.status, savedComment.created_at, 'en']
      ).catch(() => {
        pgPool?.query(
          `INSERT INTO comments (id, novel_id, novel_slug, author_name, content, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [savedComment.id, savedComment.novel_id, savedComment.novel_slug, savedComment.author_name, savedComment.content, savedComment.status, savedComment.created_at]
        ).catch(err => console.error('[PostgreSQL] addComment error:', err.message));
      });
    }

    return savedComment;
  }

  public saveComment(comment: Partial<Comment> & { novel_slug: string; author_name: string; content: string }): Comment {
    return this.addComment(comment);
  }

  public updateCommentStatus(id: string, status: 'approved' | 'hidden'): boolean {
    const c = this.state.comments.find(item => item.id === id);
    if (c) {
      c.status = status;
      this.persist(this.state);

      if (pgPool) {
        pgPool.query('UPDATE comments SET status = $1 WHERE id = $2', [status, id])
          .catch(err => console.error('[PostgreSQL] updateCommentStatus error:', err.message));
      }
      return true;
    }
    return false;
  }

  public deleteComment(id: string): boolean {
    const prev = this.state.comments.length;
    this.state.comments = this.state.comments.filter(c => c.id !== id);
    this.persist(this.state);

    if (pgPool) {
      pgPool.query('DELETE FROM comments WHERE id = $1', [id])
        .catch(err => console.error('[PostgreSQL] deleteComment error:', err.message));
    }

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

    if (pgPool) {
      const username = admin.email.split('@')[0] + '-' + Date.now().toString().slice(-4);
      pgPool.query(
        `INSERT INTO admin_users (id, email, name, role, password_hash, created_at, username, is_active, login_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO NOTHING`,
        [admin.id, admin.email, admin.name, admin.role, admin.password_hash, admin.created_at, username, true, 0]
      ).catch(() => {
        pgPool?.query(
          `INSERT INTO admin_users (id, email, name, role, password_hash, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO NOTHING`,
          [admin.id, admin.email, admin.name, admin.role, admin.password_hash, admin.created_at]
        ).catch(err => console.error('[PostgreSQL] addAdmin error:', err.message));
      });
    }

    return admin;
  }

  public deleteAdmin(id: string): boolean {
    if (this.state.admins.length <= 1) return false;
    const target = this.state.admins.find(a => a.id === id);
    if (!target || target.role === 'owner') return false;

    this.state.admins = this.state.admins.filter(a => a.id !== id);
    this.persist(this.state);

    if (pgPool) {
      pgPool.query('DELETE FROM admin_users WHERE id = $1 AND role != $2', [id, 'owner'])
        .catch(err => console.error('[PostgreSQL] deleteAdmin error:', err.message));
    }

    return true;
  }
}

export const db = new DatabaseManager();

