import Image from '@tiptap/extension-image';

export const ExtendedImage = Image.extend({
  addAttributes() {
    return {
      src: {
        default: '',
      },
      alt: {
        default: undefined,
      },
      title: {
        default: undefined,
      },
      width: {
        default: undefined,
      },
      height: {
        default: undefined,
      },
      style: {
        default: undefined,
      },
    };
  },
});
