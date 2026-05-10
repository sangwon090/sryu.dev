/**
 * UI string table. Keep entries flat and short.
 * Each `Locale` should have the same keys.
 */

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

/**
 * Korean is the default — it lives at the URL root (`/...`). English lives
 * under `/en/...`. There is no `/ko/...` namespace.
 */
export const defaultLocale: Locale = 'ko';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
};

export const ui = {
  en: {
    'site.title': 'sryu.dev',
    'site.subtitle': 'Notes on software engineering, compilers and cybersecurity.',
    'site.description': 'Notes on software engineering, compilers and cybersecurity by Sangwon Ryu.',
    'nav.home': 'Home',
    'nav.posts': 'Posts',
    'nav.notes': 'Notes',
    'nav.tags': 'Tags',
    'nav.about': 'About',
    'nav.search': 'Search',

    'home.recent': 'Recent writing',
    'home.viewAll': 'All posts →',
    'home.selectedTags': 'Selected topics',

    'posts.title': 'Posts',
    'posts.empty': 'No posts yet.',
    'posts.allTags': 'All tags',
    'posts.page': 'Page',

    'tags.title': 'Tags',
    'tags.taggedWith': 'Tagged with',

    'search.title': 'Search',
    'search.placeholder': 'Search posts…',
    'search.noResults': 'No results.',
    'search.empty': 'Start typing to search.',

    'about.title': 'About',
    'about.resume': 'https://resume.sryu.dev/en/resume',

    'article.toc': 'On this page',
    'article.readingTime': 'min read',
    'article.published': 'Published',
    'article.tags': 'Tags',
    'article.series': 'Series',
    'article.translatedFrom': 'Translated from',
    'article.viewOriginal': 'View original',

    'translation.original': 'Original',
    'translation.manual': 'Manually translated',
    'translation.machine': 'Machine-translated',
    'translation.machineNotice':
      'This article was machine-translated from the original version. Terms or nuances may be inaccurate.',

    'theme.toggle': 'Toggle theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',

    'language.switch': 'Switch language',

    'footer.copyright': '© {year} Sangwon Ryu. All rights reserved.',

    'pagination.prev': '← Newer',
    'pagination.next': 'Older →',
  },
  ko: {
    'site.title': 'sryu.dev',
    'site.subtitle': 'Notes on software engineering, compilers and cybersecurity.',
    'site.description': 'Notes on software engineering, compilers and cybersecurity by Sangwon Ryu.',

    'nav.home': '홈',
    'nav.posts': '글',
    'nav.notes': '노트',
    'nav.tags': '태그',
    'nav.about': '소개',
    'nav.search': '검색',

    'home.intro':
      '인프라, 런타임, 보안, 컴파일러, 그리고 시스템을 동작하게 만드는 작은 디테일에 관해 길게 적어 두는 개인 서고.',
    'home.recent': '최근 글',
    'home.viewAll': '전체 글 →',
    'home.selectedTags': '주요 주제',

    'posts.title': '글 목록',
    'posts.empty': '아직 글이 없습니다.',
    'posts.allTags': '모든 태그',
    'posts.page': '페이지',

    'tags.title': '태그',
    'tags.taggedWith': '태그',

    'search.title': '검색',
    'search.placeholder': '글 검색…',
    'search.noResults': '결과가 없습니다.',
    'search.empty': '검색어를 입력하세요.',

    'about.title': '소개',
    'about.resume': 'https://sryu.dev/ko/resume',

    'article.toc': '목차',
    'article.readingTime': '분 분량',
    'article.published': '작성',
    'article.tags': '태그',
    'article.series': '시리즈',
    'article.translatedFrom': '원문',
    'article.viewOriginal': '원문 보기',

    'translation.original': '원본',
    'translation.manual': '수동 번역',
    'translation.machine': '기계 번역',
    'translation.machineNotice':
      '이 글은 원문을 기계 번역한 버전입니다. 기술 용어나 뉘앙스가 부정확할 수 있습니다.',

    'theme.toggle': '테마 전환',
    'theme.light': '라이트',
    'theme.dark': '다크',
    'theme.system': '시스템',

    'language.switch': '언어 전환',

    'footer.copyright': '© {year} Sangwon Ryu. All rights reserved.',

    'pagination.prev': '← 새 글',
    'pagination.next': '이전 글 →',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['en'];

export function t(locale: Locale, key: UIKey, vars?: Record<string, string | number>): string {
  let value: string = ui[locale][key] ?? ui[defaultLocale][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return value;
}
