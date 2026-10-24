import { LanguageCode } from '../types';

export interface UiTranslations {
  // Navigation
  navHome: string;
  navExplore: string;
  navGenres: string;
  navLatest: string;
  navAbout: string;
  navLibrary: string;
  navAuthorLogin: string;
  navStudio: string;
  navExploreButton: string;

  // Hero
  heroTagline: string;
  heroHeadline: string;
  heroDescription: string;
  heroExploreCta: string;
  heroContinueReading: string;
  heroLatestReleases: string;
  heroFeaturedSeries: string;

  // Novels & Chapters
  allGenres: string;
  searchPlaceholder: string;
  chaptersCount: string;
  readNow: string;
  readChapter: string;
  continueReading: string;
  savedToLibrary: string;
  saveToLibrary: string;
  tableOfContents: string;
  discussionTab: string;
  prevChapter: string;
  nextChapter: string;
  returnToNovel: string;
  wordCount: string;
  publishedOn: string;
  statusOngoing: string;
  statusCompleted: string;

  // Comments
  leaveComment: string;
  yourName: string;
  writeThoughts: string;
  submitComment: string;
  commentPendingNotice: string;

  // Alerts
  newChapterAlert: string;
  novelSavedSuccess: string;
}

export const UI_TRANSLATIONS: Record<LanguageCode, UiTranslations> = {
  en: {
    navHome: 'Home',
    navExplore: 'Explore',
    navGenres: 'Genres',
    navLatest: 'Latest Chapters',
    navAbout: 'About',
    navLibrary: 'Library',
    navAuthorLogin: 'Author Login',
    navStudio: 'Studio',
    navExploreButton: 'Explore Stories ↗',

    heroTagline: 'A World of Stories',
    heroHeadline: 'Stories that stay with you.',
    heroDescription: 'Discover original fiction, explore new worlds, and continue reading wherever your imagination takes you.',
    heroExploreCta: 'Explore Stories ↗',
    heroContinueReading: 'Continue Reading',
    heroLatestReleases: 'Latest Releases',
    heroFeaturedSeries: 'Featured Series:',

    allGenres: 'All',
    searchPlaceholder: 'Search novels by title, author, or genre...',
    chaptersCount: 'Chapters',
    readNow: 'Read Now',
    readChapter: 'Read Chapter',
    continueReading: 'Continue Reading',
    savedToLibrary: 'Saved',
    saveToLibrary: 'Bookmark Story',
    tableOfContents: 'Table of Contents',
    discussionTab: 'Discussion & Comments',
    prevChapter: 'Previous Chapter',
    nextChapter: 'Next Chapter',
    returnToNovel: 'Return to Novel',
    wordCount: 'words',
    publishedOn: 'Published',
    statusOngoing: 'Ongoing',
    statusCompleted: 'Completed',

    leaveComment: 'Leave a reader comment',
    yourName: 'Your Name or Alias',
    writeThoughts: 'Share your thoughts on this chapter...',
    submitComment: 'Post Comment',
    commentPendingNotice: 'Your comment has been submitted for review.',

    newChapterAlert: 'New chapter released!',
    novelSavedSuccess: 'Novel saved successfully'
  },

  // Natural Roman-script Hinglish (Real bilingual Hindi-English reader dialect)
  hi: {
    navHome: 'Home',
    navExplore: 'Explore',
    navGenres: 'Genres',
    navLatest: 'Taaza Chapters',
    navAbout: 'Akhyana Ke Baare Mein',
    navLibrary: 'Aapki Library',
    navAuthorLogin: 'Author Login',
    navStudio: 'Author Studio',
    navExploreButton: 'Kahaniyan Khojein ↗',

    heroTagline: 'Kahaniyon Ki Nayi Duniya',
    heroHeadline: 'Aisi kahaniyan jo hamesha aapke saath rahein.',
    heroDescription: 'Original novels aur light novels discover karein, nayi fictional worlds explore karein aur sukoon se padhein.',
    heroExploreCta: 'Kahaniyan Explore Karein ↗',
    heroContinueReading: 'Padhna Jaari Rakhein',
    heroLatestReleases: 'Taaza Releases',
    heroFeaturedSeries: 'Khaas Peshkash:',

    allGenres: 'Sabhi',
    searchPlaceholder: 'Novel ka naam, lekhak ya genre se khojein...',
    chaptersCount: 'Chapters',
    readNow: 'Abhi Padhein',
    readChapter: 'Chapter Padhein',
    continueReading: 'Padhna Jaari Rakhein',
    savedToLibrary: 'Library Mein Saved Hai',
    saveToLibrary: 'Library Mein Save Karein',
    tableOfContents: 'Anukramanika (Contents)',
    discussionTab: 'Readers Ki Charcha',
    prevChapter: 'Pichhla Chapter',
    nextChapter: 'Agla Chapter',
    returnToNovel: 'Novel Par Vaapas Jaayein',
    wordCount: 'shabd',
    publishedOn: 'Publish hua',
    statusOngoing: 'Jaari hai (Ongoing)',
    statusCompleted: 'Poora hua (Completed)',

    leaveComment: 'Apna vichar ya review share karein',
    yourName: 'Aapka Naam',
    writeThoughts: 'Is chapter par apni ray likhein...',
    submitComment: 'Comment Bhejein',
    commentPendingNotice: 'Aapka comment successfully bhej diya gaya hai.',

    newChapterAlert: 'Naya chapter release ho gaya hai!',
    novelSavedSuccess: 'Novel successfully save ho gayi hai'
  },

  jp: {
    navHome: 'ホーム',
    navExplore: '作品一覧',
    navGenres: 'ジャンル',
    navLatest: '最新話',
    navAbout: '当サイトについて',
    navLibrary: '本棚',
    navAuthorLogin: '作家ログイン',
    navStudio: '作家スタジオ',
    navExploreButton: '物語を探す ↗',

    heroTagline: '静寂の森の物語',
    heroHeadline: '心に残る、永遠の物語。',
    heroDescription: '完全オリジナルの小説とライトノベル。静謐な読書体験をあなたにお届けします。',
    heroExploreCta: '作品を探す ↗',
    heroContinueReading: '続きから読む',
    heroLatestReleases: '新着章',
    heroFeaturedSeries: '注目作品:',

    allGenres: 'すべて',
    searchPlaceholder: 'タイトル、作者名、ジャンルで検索...',
    chaptersCount: '話',
    readNow: '今すぐ読む',
    readChapter: '章を読む',
    continueReading: '続きを読む',
    savedToLibrary: '保存済み',
    saveToLibrary: '本棚に追加',
    tableOfContents: '目次',
    discussionTab: '読者の感想・交流',
    prevChapter: '前の話',
    nextChapter: '次の話',
    returnToNovel: '作品詳細に戻る',
    wordCount: '文字',
    publishedOn: '公開日',
    statusOngoing: '連載中',
    statusCompleted: '完結',

    leaveComment: '感想を投稿する',
    yourName: 'お名前またはペンネーム',
    writeThoughts: 'この章への感想をお書きください...',
    submitComment: '感想を投稿',
    commentPendingNotice: '感想が送信されました。',

    newChapterAlert: '新しい章が公開されました！',
    novelSavedSuccess: '小説が保存されました'
  }
};
