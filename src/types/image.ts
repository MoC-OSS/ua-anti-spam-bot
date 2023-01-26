export enum ImageType {
  PHOTO = 'photo',
  STICKER = 'sticker',
  VIDEO_STICKER = 'video_sticker',
  VIDEO = 'video',
  VIDEO_NOTE = 'video_note',
  ANIMATION = 'animation', // GIFs
  UNKNOWN = 'unknown',
}

export type ImageVideoTypes = ImageType.VIDEO | ImageType.VIDEO_STICKER | ImageType.ANIMATION | ImageType.VIDEO_NOTE;
