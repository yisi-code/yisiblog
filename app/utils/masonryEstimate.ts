type PhotoLike = {
  caption?: string
  width?: number
  height?: number
}

export function estimatePhotoMasonryHeight(photo: PhotoLike) {
  const ratio = typeof photo.width === 'number' && typeof photo.height === 'number' && photo.width > 0
    ? photo.height / photo.width
    : 0.75
  const captionHeight = photo.caption ? 1.5 : 0

  return ratio * 12 + captionHeight
}
