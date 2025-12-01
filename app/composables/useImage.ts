export const useImage = () => {
  /**
   * 获取图片的缩略图链接。
   * 规则：在原始图片URL中，最后一个斜杠之后的文件名前插入 "thumb/220/" 目录。
   * 例如： "https://i.psnprofiles.com/games/0b1cbc/M9b845e.png"
   *       转换为 "https://i.psnprofiles.com/games/0b1cbc/thumb/220/M9b845e.png"
   *
   * @param imageUrl 原始图片链接
   * @returns 缩略图链接
   */
  function getThumbnailImage(imageUrl: string, imageSize: number): string {
    const lastSlashIndex = imageUrl.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      return imageUrl;
    }
    const baseUrl = imageUrl.substring(0, lastSlashIndex + 1);
    const fileName = imageUrl.substring(lastSlashIndex + 1);

    return `${baseUrl}thumb/${imageSize}/${fileName}`;
  }

  return {
    getThumbnailImage,
  };
};
