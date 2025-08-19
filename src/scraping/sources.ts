export const SOURCES = [
  {
    key: 'rbc-realty',
    name: 'РБК Недвижимость',
    type: 'html' as const,
    url: 'https://realty.rbc.ru/',
    // css селекторы: контейнер карточки, заголовок, ссылка, описание, дата (если есть)
    meta: {
      item: 'a[itemprop="url"]', // карточки на главной ленте
      title: '[itemprop="headline"]',
      href: (el: any) => el.getAttribute('href'),
      description: null,
      date: null,
      transformUrl: (href: string) => (href.startsWith('http') ? href : `https://realty.rbc.ru${href}`),
    },
  },
  {
    key: 'tass-realty',
    name: 'ТАСС: Недвижимость',
    type: 'html' as const,
    url: 'https://tass.ru/nedvizhimost',
    meta: {
      item: 'a[href*="/nedvizhimost/"]',
      title: (el: any) => el.text?.trim(),
      href: (el: any) => el.getAttribute('href'),
      description: null,
      date: null,
      transformUrl: (href: string) => (href.startsWith('http') ? href : `https://tass.ru${href}`),
    },
  },
  // пример RSS-источника (подставьте реальный RSS)
  // {
  //   key: 'some-rss',
  //   name: 'Пример RSS',
  //   type: 'rss' as const,
  //   url: 'https://example.com/feed.xml'
  // }
] as const;
