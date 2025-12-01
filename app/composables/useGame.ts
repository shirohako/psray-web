export const useGame = () => {
  interface Game {
    igdb_slug: string;
    igdb_image_id: string;
    first_release_date: string;
    genres: string | null;
    companies: Company[];
    platforms: string | null;
  }

  interface Company {
    id: number;
    name: string;
    pivot: {
      developer: number;
    };
  }

  /**
   * 判断游戏是否在指定的平台上发行
   * @param game 游戏对象
   * @param platformName 平台名称，可传入 "Nintendo", "Smartphone", "Xbox", "Windows", "PlayStation"
   * @returns 存在对应平台返回 true，否则返回 false
   */
  function hasPlatformRelease(game: Game, platformName: string): boolean {
    if (!game.platforms) {
      return false;
    }

    const platforms = game.platforms.split(',').map(id => id.trim());
    const idsToCheck = platformMapping[platformName];
    if (!idsToCheck) {
      return false;
    }
    return idsToCheck.some(id => platforms.includes(id));
  }

  // 平台映射对象，将平台名称映射为对应的平台 ID 数组
  const platformMapping: { [key: string]: string[] } = {
    Windows: ['6'],
    Nintendo: ['130', '5', '41', '4', '18', '19', '20', '21', '22', '24', '33', '37', '47'],
    Smartphone: ['34', '39'],
    Xbox: ['169', '11', '12', '36', '49'],
    PlayStation: ['48', '167'],
  };

  function getCover(game: Game) {
    const slug = game.igdb_image_id;
    return `https://images.igdb.com/igdb/image/upload/t_cover_big/${slug}.png`;
  }

  function getReleaseDate(game: Game) {
    return game.first_release_date;
  }

  function getDeveloperName(game: Game): string {
    if (!game?.companies) {
      return '';
    }
    return game.companies
      .filter(company => company.pivot.developer === 1)
      .map(company => company.name)
      .join(', ');
  }

  function getPublisherName(game: Game) {}

  function getGenres(game: Game): string[] {
    if (!game.genres) {
      return [];
    }
    return game.genres.split(',').map(genre => genre.trim());
  }

  function getIgdbLink(game: Game) {
    return `https://www.igdb.com/games/${game.igdb_slug}`;
  }

  function getGameCover(slug: string) {
    return `https://images.igdb.com/igdb/image/upload/t_cover_big/${slug}.png`;
  }

  function getGameIgdbLink(slug: string) {
    return `https://www.igdb.com/games/${slug}`;
  }

  function hasWindowsRelease(releases: any) {
    if (!releases) {
      return false;
    }
    const platforms = releases.split(',');
    return platforms.length > 0 && platforms.indexOf('6', 0) >= 0;
  }

  function hasNintendoRelease(releases: any) {
    if (!releases) {
      return false;
    }

    const platforms = releases.split(',');

    if (platforms.length > 0) {
      // Nintendo Switch
      if (platforms.indexOf('130', 0) >= 0) {
        return true;
      }
      // Wii
      if (platforms.indexOf('5', 0) >= 0) {
        return true;
      }
      // Wii U
      if (platforms.indexOf('41', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('4', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('18', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('19', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('20', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('21', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('22', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('24', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('33', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('37', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('47', 0) >= 0) {
        return true;
      }
    }
    return false;
  }

  function hasSmartphoneRelease(releases: any) {
    if (!releases) {
      return false;
    }

    const platforms = releases.split(',');

    if (platforms.length > 0) {
      // Android
      if (platforms.indexOf('34', 0) >= 0) {
        return true;
      }
      // iOS
      if (platforms.indexOf('39', 0) >= 0) {
        return true;
      }
    }
    return false;
  }

  function hasXboxRelease(releases: any) {
    if (!releases) {
      return false;
    }

    const platforms = releases.split(',');

    if (platforms.length > 0) {
      // Xbox Series
      if (platforms.indexOf('169', 0) >= 0) {
        return true;
      }
      // Xbox
      if (platforms.indexOf('11', 0) >= 0) {
        return true;
      }
      // Xbox 360
      if (platforms.indexOf('12', 0) >= 0) {
        return true;
      }
      // Xbox Live Arcade
      if (platforms.indexOf('36', 0) >= 0) {
        return true;
      }
      if (platforms.indexOf('49', 0) >= 0) {
        return true;
      }
    }
    return false;
  }

  function containsPlatform(platforms: any, id: any) {
    const platformsArray = platforms.split(',');
    return platformsArray.includes(String(id));
  }

  return {
    containsPlatform,
    getGameCover,
    getGameIgdbLink,
    hasWindowsRelease,
    hasNintendoRelease,
    hasSmartphoneRelease,
    hasXboxRelease,
    getCover,
    getReleaseDate,
    getDeveloperName,
    getPublisherName,
    getGenres,
    hasPlatformRelease,
    getIgdbLink,
  };
};
