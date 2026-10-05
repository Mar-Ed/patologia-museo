export function isImageDirectory(name) {
  const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return /^\d*(imagen|image|img)/.test(key);
}

// The first component identifies the pathology, not an image subfolder.
export function isAllowedImageSource(source) {
  return source.replace(/\\/g, "/").split("/").slice(1, -1).some(isImageDirectory);
}
