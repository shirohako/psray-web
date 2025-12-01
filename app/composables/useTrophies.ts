import _ from 'lodash';

export const useTrophies = () => {
  const regionTagsA = [
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/08/30/66d147c8d6ef7.png',
      code: 'AS',
      name: 'Asia',
      description: '亚洲地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:jp-4x3',
      code: 'JP',
      name: 'Japan',
      description: '日本地区版本',
    },
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/08/30/66d1436534d81.png',
      code: 'NA',
      name: 'North America',
      description: '北美地区版本',
    },
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/08/30/66d15c3a64f26.png',
      code: 'EU',
      name: 'Europe',
      description: '欧洲地区版本',
    },
  ];

  const regionTagsB = [
    {
      iconType: 'icon',
      icon: 'flag:hk-4x3',
      code: 'HK',
      name: 'Hong Kong',
      description: '香港地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:kr-4x3',
      code: 'KR',
      name: 'South Korea',
      description: '韩国地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:cn-4x3',
      code: 'CN',
      name: 'China',
      description: '中国大陆地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:tw-4x3',
      code: 'TW',
      name: 'Taiwan',
      description: '台版地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:fr-4x3',
      code: 'FR',
      name: 'France',
      description: '法国地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:de-4x3',
      code: 'DE',
      name: 'Germany',
      description: '德国地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:es-4x3',
      code: 'ES',
      name: 'Spain',
      description: '西班牙地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:gb-4x3',
      code: 'UK',
      name: 'United Kingdom',
      description: '英国地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:au-4x3',
      code: 'AU',
      name: 'Australia',
      description: '澳大利亚地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:br-4x3',
      code: 'BR',
      name: 'Brazil',
      description: '巴西地区版本',
    },
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/08/25/66cad9bc37312.png',
      code: 'LA',
      name: 'South America',
      description: '南美地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:ru-4x3',
      code: 'RU',
      name: 'Russia',
      description: '俄罗斯地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:nz-4x3',
      code: 'NZ',
      name: 'New Zealand',
      description: '新西兰地区版本',
    },
    {
      iconType: 'icon',
      icon: 'flag:sa-4x3',
      code: 'SA',
      name: 'Saudi Arabia',
      description: '沙特地区版本',
    },
  ];

  const regionTagsC = [
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/08/25/66caa41f543b1.png',
      code: 'P',
      name: 'Physical Copy',
      description: '实体版游戏限定',
    },
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/08/25/66caa4433abe8.png',
      code: 'D',
      name: 'Digital Game',
      description: '数字游戏限定',
    },
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/10/17/6710ac113c691.png',
      code: 'ORIG',
      name: 'Original',
      description: '原版/初版',
    },
    {
      iconType: 'image',
      icon: 'https://i.psray.net/i/2024/10/17/6710ac293b239.png',
      code: 'BDL',
      name: 'Bundle',
      description: '合集',
    },
  ];

  function getAllTrophiesRegionTags() {
    return regionTagsA.concat(regionTagsB, regionTagsC);
  }

  function getRegionTagA() {
    return regionTagsA;
  }

  function getRegionTagB() {
    return regionTagsB;
  }

  function getRegionTagC() {
    return regionTagsC;
  }

  function getRegionTag(code: any) {
    return _.find(getAllTrophiesRegionTags(), { code });
  }

  return {
    getRegionTagA,
    getRegionTagB,
    getRegionTagC,
    getRegionTag,
    getAllTrophiesRegionTags,
  };
};
