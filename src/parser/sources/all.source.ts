// РФ: источники для мини-статей по недвижимости + как вытягивать из них

export enum RuRealEstateSource {
  ROSSTAT = "ROSSTAT",
  EMISS_FEDSTAT = "EMISS_FEDSTAT",
  ROSREESTR = "ROSREESTR",
  EGRN = "EGRN",
  MINSTROY = "MINSTROY",
  DOM_RF_ANALYTICS = "DOM_RF_ANALYTICS",
  CBR_MORTGAGE = "CBR_MORTGAGE",
  CIAN_ANALYTICS = "CIAN_ANALYTICS",
  AVITO_REALTY_RESEARCH = "AVITO_REALTY_RESEARCH",
  YANDEX_REALTY_ANALYTICS = "YANDEX_REALTY_ANALYTICS",
  ERZ_NASH_DOM_RF = "ERZ_NASH_DOM_RF",
  IRN = "IRN",
  DOMCLICK_ANALYTICS = "DOMCLICK_ANALYTICS",
  NOVOSTROY_ANALYTICS = "NOVOSTROY_ANALYTICS",
  RBC_REALTY = "RBC_REALTY",
  KOMMERSANT_REALTY = "KOMMERSANT_REALTY",
  VEDOMOSTI_REALTY = "VEDOMOSTI_REALTY",
  TASS_REALTY = "TASS_REALTY",
  INTERFAX_REALTY = "INTERFAX_REALTY",
  RIA_REALTY = "RIA_REALTY",
  REGIONAL_PORTALS_SPB_BN = "REGIONAL_PORTALS_SPB_BN",
  MIR_KVARTIR_ANALYTICS = "MIR_KVARTIR_ANALYTICS"
}

// Краткий гайд по вытягиванию (используй axios/fetch + rss-parser + cheerio + csv-parse + pdf-parse)
export const SourceGuide: Record<RuRealEstateSource, {
  category: "stats" | "registry" | "analytics" | "news";
  homepage: string;
  access: Array<"API" | "RSS" | "HTML" | "CSV/XLSX" | "PDF">;
  sample: string[];              // примерные эндпоинты/лендинги/ленты (для навигации)
  extract: string[];             // как парсить
  cadence: "daily" | "weekly" | "monthly" | "quarterly" | "ad-hoc";
  fields: string[];              // что доставать для мини-статей
}> = {
  [RuRealEstateSource.ROSSTAT]: {
    category: "stats",
    homepage: "https://rosstat.gov.ru",
    access: ["HTML","CSV/XLSX","PDF"],
    sample: ["https://rosstat.gov.ru/statistics/zhilishchnoe_hozyaistvo", "https://www.fedstat.ru/indicator/*"],
    extract: [
      "CSV/XLSX: скачай таблицу → csv-parse/xlsx, нормализуй колонки/дату",
      "PDF: pdf-parse и/или ручные регэкспы по таблицам, сохраняй метаданные выпуска"
    ],
    cadence: "monthly",
    fields: ["ввод жилья", "цены на жильё (ИПЦ/ИЖС)", "объём строительства", "регион"]
  },
  [RuRealEstateSource.EMISS_FEDSTAT]: {
    category: "stats",
    homepage: "https://www.fedstat.ru",
    access: ["HTML","CSV/XLSX"],
    sample: ["https://www.fedstat.ru/indicator/31053 (пример)", "экспорт в CSV у каждого индикатора"],
    extract: ["Автоэкспорт CSV, маппинг кодов показателей → tidy-формат (date,value,region,indicator)"],
    cadence: "monthly",
    fields: ["показатель", "значение", "регион", "единица"]
  },
  [RuRealEstateSource.ROSREESTR]: {
    category: "registry",
    homepage: "https://rosreestr.gov.ru",
    access: ["HTML","PDF"],
    sample: ["Разделы: статистика/отчёты, новости ведомства"],
    extract: ["HTML новости через cheerio (заголовок/дата/тизер/ссылка)", "PDF отчёты через pdf-parse"],
    cadence: "monthly",
    fields: ["сделки/регистрация прав", "ипотека", "кадастр"]
  },
  [RuRealEstateSource.EGRN]: {
    category: "registry",
    homepage: "https://rosreestr.gov.ru/egrn",
    access: ["HTML","PDF"],
    sample: ["Пояснительные записки/ежеквартальные отчёты"],
    extract: ["pdf-parse таблиц, извлечение сводных по регионам"],
    cadence: "quarterly",
    fields: ["число сделок", "тип объекта", "регион"]
  },
  [RuRealEstateSource.MINSTROY]: {
    category: "registry",
    homepage: "https://minstroyrf.gov.ru",
    access: ["HTML","PDF","RSS"],
    sample: ["Новости/проекты НПА, отчёты по строительству"],
    extract: ["RSS на новости; PDF отчётов через pdf-parse; в новостях — заголовок/дата/квоты/меры"],
    cadence: "weekly",
    fields: ["регулирование", "меры поддержки", "комментарии министерства"]
  },
  [RuRealEstateSource.DOM_RF_ANALYTICS]: {
    category: "analytics",
    homepage: "https://дом.рф",
    access: ["HTML","PDF"],
    sample: ["Аналитика ДОМ.РФ/ежемесячные обзоры ипотечного рынка"],
    extract: ["Страницы обзоров (cheerio), PDF отчёты (pdf-parse)"],
    cadence: "monthly",
    fields: ["ставки/выдачи ипотеки", "сегменты (новострой/вторичка)", "первичный рынок"]
  },
  [RuRealEstateSource.CBR_MORTGAGE]: {
    category: "stats",
    homepage: "https://cbr.ru",
    access: ["HTML","CSV/XLSX"],
    sample: ["Раздел статистики по ипотеке/ставке ключевой"],
    extract: ["Скачивание таблиц XLSX → xlsx", "Нормализация по дате (YYYY-MM)"],
    cadence: "monthly",
    fields: ["средняя ставка", "объём выдач", "задолженность"]
  },
  [RuRealEstateSource.CIAN_ANALYTICS]: {
    category: "analytics",
    homepage: "https://www.cian.ru/analytics/",
    access: ["HTML","RSS"],
    sample: ["Лента аналитики/исследований, иногда RSS"],
    extract: ["HTML: заголовок/дата/регион/ключевые цифры из абзацев и <table>"],
    cadence: "weekly",
    fields: ["медианная цена", "динамика м/м и г/г", "вакантность", "экспозиция"]
  },
  [RuRealEstateSource.AVITO_REALTY_RESEARCH]: {
    category: "analytics",
    homepage: "https://www.avito.ru/research/realty",
    access: ["HTML","PDF"],
    sample: ["Исследования Авито Недвижимость"],
    extract: ["HTML карточки исследований; PDF парсинг ключевых графиков и таблиц"],
    cadence: "monthly",
    fields: ["цены/аренда", "спрос/предложение", "география"]
  },
  [RuRealEstateSource.YANDEX_REALTY_ANALYTICS]: {
    category: "analytics",
    homepage: "https://realty.yandex.ru",
    access: ["HTML"],
    sample: ["Блог/аналитика/дайджесты рынка"],
    extract: ["cheerio: текст, цифры в <strong>, таблицы"],
    cadence: "ad-hoc",
    fields: ["индексы цен", "поведение пользователей"]
  },
  [RuRealEstateSource.ERZ_NASH_DOM_RF]: {
    category: "registry",
    homepage: "https://наш.дом.рф",
    access: ["HTML","CSV/XLSX"],
    sample: ["Единый реестр застройщиков, объекты, динамика ввода"],
    extract: ["Списки/таблицы объектов → парсинг/экспорт, агрегация по региону и стадии"],
    cadence: "weekly",
    fields: ["кол-во проектов", "этапы строительства", "объём ввода"]
  },
  [RuRealEstateSource.IRN]: {
    category: "analytics",
    homepage: "https://www.irn.ru",
    access: ["HTML","RSS"],
    sample: ["IRN аналитика/индексы"],
    extract: ["RSS/HTML: тайтл/дата/ключевые индексы из таблиц"],
    cadence: "weekly",
    fields: ["индексы IRN", "динамика цен (Москва/РФ)"]
  },
  [RuRealEstateSource.DOMCLICK_ANALYTICS]: {
    category: "analytics",
    homepage: "https://domclick.ru",
    access: ["HTML","PDF"],
    sample: ["Журнал/исследования Сбера по ипотеке/рынку"],
    extract: ["HTML карточки статей; PDF отчёты через pdf-parse"],
    cadence: "monthly",
    fields: ["ставки", "одобрения", "средний чек"]
  },
  [RuRealEstateSource.NOVOSTROY_ANALYTICS]: {
    category: "analytics",
    homepage: "https://www.novostroy.ru",
    access: ["HTML"],
    sample: ["Аналитика по новостройкам и застройщикам"],
    extract: ["Парсинг таблиц/карточек проектов, извлечение цен и сроков"],
    cadence: "weekly",
    fields: ["ценники в новостройках", "сроки сдачи", "ТОП застройщики"]
  },
  [RuRealEstateSource.RBC_REALTY]: {
    category: "news",
    homepage: "https://realty.rbc.ru",
    access: ["HTML","RSS"],
    sample: ["RSS лента, рубрики «Недвижимость»"],
    extract: ["RSS: title/link/pubDate; HTML: текст + schema.org Article для даты/автора"],
    cadence: "daily",
    fields: ["новости рынка", "комментарии участников", "регуляторика"]
  },
  [RuRealEstateSource.KOMMERSANT_REALTY]: {
    category: "news",
    homepage: "https://www.kommersant.ru/rubric/realty",
    access: ["HTML","RSS"],
    sample: ["Рубрика «Недвижимость», RSS"],
    extract: ["RSS + HTML: лид, цитаты, цифры из первого экрана/инфографики"],
    cadence: "daily",
    fields: ["сделки", "проекты", "законопроекты"]
  },
  [RuRealEstateSource.VEDOMOSTI_REALTY]: {
    category: "news",
    homepage: "https://www.vedomosti.ru/realty",
    access: ["HTML","RSS"],
    sample: ["Лента «Недвижимость»"],
    extract: ["Парсинг карточек: заголовок/дата/ключевые числа, внутри — pull-quotes"],
    cadence: "daily",
    fields: ["рынок", "девелопмент", "аренда/офисы"]
  },
  [RuRealEstateSource.TASS_REALTY]: {
    category: "news",
    homepage: "https://tass.ru/nedvizhimost",
    access: ["HTML","RSS"],
    sample: ["Лента ТАСС «Недвижимость»"],
    extract: ["RSS + HTML; извлечение цитат официальных лиц и дат постановлений"],
    cadence: "daily",
    fields: ["официальные новости", "региональные сюжеты"]
  },
  [RuRealEstateSource.INTERFAX_REALTY]: {
    category: "news",
    homepage: "https://www.interfax-realty.ru",
    access: ["HTML","RSS"],
    sample: ["Ленты регионами/темами"],
    extract: ["RSS: быстрая инкрементальная загрузка; HTML: основная цифра в лид-абзаце"],
    cadence: "daily",
    fields: ["строительство", "ипотека", "арендный рынок"]
  },
  [RuRealEstateSource.RIA_REALTY]: {
    category: "news",
    homepage: "https://realty.ria.ru",
    access: ["HTML","RSS"],
    sample: ["Новости и обзоры RIA Недвижимость"],
    extract: ["RSS + HTML; schema.org для даты/издателя; вынимай ключевые проценты"],
    cadence: "daily",
    fields: ["цены", "спрос", "льготные программы"]
  },
  [RuRealEstateSource.REGIONAL_PORTALS_SPB_BN]: {
    category: "news",
    homepage: "https://www.bn.ru",
    access: ["HTML","RSS"],
    sample: ["Питер/СЗФО лента BN.ru"],
    extract: ["RSS для нарезки дайджестов; HTML таблицы сделок/тенденций"],
    cadence: "weekly",
    fields: ["локальные индикаторы", "новости застройщиков"]
  },
  [RuRealEstateSource.MIR_KVARTIR_ANALYTICS]: {
    category: "analytics",
    homepage: "https://www.mirkvartir.ru",
    access: ["HTML"],
    sample: ["Аналитические заметки/индексы цен"],
    extract: ["Парсинг статей, извлечение цифр через регэксп %/₽/кв.м"],
    cadence: "weekly",
    fields: ["цены м²", "динамика", "город/район"]
  }
};

// Технические заметки по вытягиванию:
// - HTTP: axios/fetch с ретраями, respect robots.txt; rate-limit (p-queue).
// - RSS: rss-parser → {title, link, pubDate, categories}. Дедуп по link.
// - HTML: cheerio → селекторы для тайтла (<h1>), даты (meta[property='article:published_time'] / time), лид-абзац, таблицы.
// - Таблицы: csv-parse/xlsx → tidy-формат (date, region, indicator, value, unit).
// - PDF: pdf-parse; если таблицы «картинками» — tesseract-ocr только при необходимости.
// - Нормализация дат: все к ISO (YYYY-MM-DD), таймзона Europe/Moscow/Europe/Prague по необходимости.
// - Храни метаданные: source, url, fetched_at, published_at, region, tags.
// - Для мини-статей генерируй: заголовок (темплейт), 3–5 тезисов с цифрами, 1–2 сравнения (м/м, г/г), короткий вывод.
