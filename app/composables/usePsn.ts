import _ from 'lodash';

export const usePsn = () => {
  const localizationsWithRegion = [
    {
      language: 'ja',
      code: 'ja-JP',
      name: 'Japanese',
      native_name: '日本語',
    },
    {
      language: 'en',
      code: 'en-GB',
      name: 'British English',
      native_name: 'British English',
    },
    {
      language: 'en',
      code: 'en-US',
      name: 'English',
      native_name: 'English',
    },
    {
      language: 'zh',
      code: 'zh-Hans',
      name: 'Chinese (Simplified)',
      native_name: '简体中文',
    },
    {
      language: 'zh',
      code: 'zh-Hant',
      name: 'Chinese (Traditional)',
      native_name: '繁體中文',
    },
    {
      language: 'ko',
      code: 'ko-KR',
      name: 'Korean',
      native_name: '한국어',
    },
    {
      language: 'fr',
      code: 'fr-FR',
      name: 'French',
      native_name: 'Français',
    },
    {
      language: 'fr',
      code: 'fr-CA',
      name: 'French (Canada)',
      native_name: 'français (Canada)',
    },
    {
      language: 'es',
      code: 'es-ES',
      name: 'Spanish',
      native_name: 'Español',
    },
    {
      language: 'es',
      code: 'es-419',
      name: 'Spanish (Latin America)',
      native_name: 'Español (Latinoamérica)',
    },
    {
      language: 'de',
      code: 'de-DE',
      name: 'German',
      native_name: 'Deutsch',
    },
    {
      language: 'it',
      code: 'it-IT',
      name: 'Italian',
      native_name: 'Italiano',
    },
    {
      language: 'ru',
      code: 'ru-RU',
      name: 'Russian',
      native_name: 'Pусский',
    },
    {
      language: 'nl',
      code: 'nl-NL',
      name: 'Dutch',
      native_name: 'Nederlands',
    },
    {
      language: 'pt',
      code: 'pt-PT',
      name: 'Portuguese',
      native_name: 'Português',
    },
    {
      language: 'pt',
      code: 'pt-BR',
      name: 'Portuguese (Brazil)',
      native_name: 'português (Brasil)',
    },
    {
      language: 'fi',
      code: 'fi-FI',
      name: 'Finnish',
      native_name: 'Suomi',
    },
    {
      language: 'sv',
      code: 'sv-SE',
      name: 'Swedish',
      native_name: 'Svenska',
    },
    {
      language: 'da',
      code: 'da-DK',
      name: 'Danish',
      native_name: 'Dansk',
    },
    {
      language: 'nb',
      code: 'nb-NO',
      name: 'Norwegian',
      native_name: 'Norsk',
    },
    {
      language: 'pl',
      code: 'pl-PL',
      name: 'Polish',
      native_name: 'Polski',
    },
    {
      language: 'tr',
      code: 'tr-TR',
      name: 'Turkish',
      native_name: 'Türkçe',
    },
    {
      language: 'ar',
      code: 'ar-AE',
      name: 'Arabic',
      native_name: 'العربية',
    },
    {
      language: 'cs',
      code: 'cs-CZ',
      name: 'Czech',
      native_name: 'Čeština',
    },
    {
      language: 'hu',
      code: 'hu-HU',
      name: 'Hungarian',
      native_name: 'Magyar',
    },
    {
      language: 'el',
      code: 'el-GR',
      name: 'Greek',
      native_name: 'Ελληνικά',
    },
    {
      language: 'ro',
      code: 'ro-RO',
      name: 'Romanian',
      native_name: 'Română',
    },
    {
      language: 'th',
      code: 'th-TH',
      name: 'Thai',
      native_name: 'ไทย',
    },
  ];

  const simpleLocalizations = [
    {
      code: 'ja',
      name: 'Japanese',
      native_name: '日本語',
    },
    {
      code: 'en',
      name: 'English',
      native_name: 'English',
    },
    {
      code: 'zh',
      name: 'Chinese',
      native_name: '中文',
    },
    {
      code: 'ko',
      name: 'Korean',
      native_name: '한국어',
    },
    {
      code: 'fr',
      name: 'French',
      native_name: 'Français',
    },
    {
      code: 'es',
      name: 'Spanish',
      native_name: 'Español',
    },
    {
      code: 'de',
      name: 'German',
      native_name: 'Deutsch',
    },
    {
      code: 'it',
      name: 'Italian',
      native_name: 'Italiano',
    },
    {
      code: 'ru',
      name: 'Russian',
      native_name: 'Pусский',
    },
    {
      code: 'nl',
      name: 'Dutch',
      native_name: 'Nederlands',
    },
    {
      code: 'pt',
      name: 'Portuguese',
      native_name: 'Português',
    },
    {
      code: 'fi',
      name: 'Finnish',
      native_name: 'Suomi',
    },
    {
      code: 'sv',
      name: 'Swedish',
      native_name: 'Svenska',
    },
    {
      code: 'da',
      name: 'Danish',
      native_name: 'Dansk',
    },
    {
      code: 'nb',
      name: 'Norwegian',
      native_name: 'Norsk',
    },
    {
      code: 'pl',
      name: 'Polish',
      native_name: 'Polski',
    },
    {
      code: 'tr',
      name: 'Turkish',
      native_name: 'Türkçe',
    },
    {
      code: 'ar',
      name: 'Arabic',
      native_name: 'العربية',
    },
    {
      code: 'cs',
      name: 'Czech',
      native_name: 'Čeština',
    },
    {
      code: 'hu',
      name: 'Hungarian',
      native_name: 'Magyar',
    },
    {
      code: 'el',
      name: 'Greek',
      native_name: 'Ελληνικά',
    },
    {
      code: 'ro',
      name: 'Romanian',
      native_name: 'Română',
    },
    {
      code: 'th',
      name: 'Thai',
      native_name: 'ไทย',
    },
  ];

  const trophyIcon = {
    platinum: 'https://i.psray.net/i/2023/09/04/64f4e3dd41b45.png',
    gold: 'https://i.psray.net/i/2024/09/01/66d46bee1ad33.png',
    silver: 'https://i.psray.net/i/2024/09/01/66d46befbc188.png',
    bronze: 'https://i.psray.net/i/2024/09/01/66d46beec5bb1.png',
  };

  type TrophyType = keyof typeof trophyIcon;

  function getTrophyIcon(type: string): string | undefined {
    return trophyIcon[type.toLowerCase() as TrophyType];
  }

  function getAllLocalization() {
    return localizationsWithRegion;
  }

  function getEnglishName(code: any) {
    return _.find(simpleLocalizations, { code })?.name || 'Unknow';
  }

  function getNativeName(code: any) {
    return _.find(simpleLocalizations, { code })?.native_name || 'Unknow';
  }

  const region = [
    { name: 'Global (All PSN Servers)', code: 'Global' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Austria', code: 'AT' },
    { name: 'Australia', code: 'AU' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Bulgaria', code: 'BG' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Bolivia', code: 'BO' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Canada', code: 'CA' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Chile', code: 'CL' },
    { name: 'China', code: 'CN' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Cyprus', code: 'CY' },
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Germany', code: 'DE' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'Spain', code: 'ES' },
    { name: 'Finland', code: 'FI' },
    { name: 'France', code: 'FR' },
    { name: 'Greece', code: 'GR' },
    { name: 'Hong Kong', code: 'HK' },
    { name: 'Croatia', code: 'HR' },
    { name: 'Hungary', code: 'HU' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Israel', code: 'IL' },
    { name: 'India', code: 'IN' },
    { name: 'Italy', code: 'IT' },
    { name: 'Japan', code: 'JP' },
    { name: 'Kuwait', code: 'KW' },
    { name: 'Lebanon', code: 'LB' },
    { name: 'Luxembourg', code: 'LU' },
    { name: 'Sri Lanka', code: 'LK' },
    { name: 'Lithuania', code: 'LT' },
    { name: 'Latvia', code: 'LV' },
    { name: 'Morocco', code: 'MA' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Norway', code: 'NO' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'Oman', code: 'OM' },
    { name: 'Panama', code: 'PA' },
    { name: 'Peru', code: 'PE' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Poland', code: 'PL' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Romania', code: 'RO' },
    { name: 'Russia', code: 'RU' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Slovakia', code: 'SK' },
    { name: 'Slovenia', code: 'SI' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Spain', code: 'ES' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Taiwan', code: 'TW' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Turkey', code: 'TR' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Ukraine', code: 'UA' },
    { name: 'United States of America', code: 'US' },
    { name: 'Vietnam', code: 'VN' },
  ];

  function getAllRegions() {
    return region;
  }

  function getRegionName(code: any) {
    return _.find(region, { code })?.name || 'Unknow';
  }

  function getTrophySetTitleSlug(title: any) {
    return title.replace(/\s+/g, '-').replace(/\//g, '-');
  }

  return {
    trophyIcon,
    getTrophySetTitleSlug,
    getAllRegions,
    getRegionName,
    getTrophyIcon,
    getAllLocalization,
    getEnglishName,
    getNativeName,
  };
};
