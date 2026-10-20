export const buildDownloadUrl = (rawUrl: string, fileName?: string) => {
  if (!rawUrl) return "#";

  if (rawUrl.startsWith("blob:")) return rawUrl;

  const url = new URL(rawUrl);

  if (!url.searchParams.has("alt")) {
    url.searchParams.set("alt", "media");
  }

  if (fileName && fileName.trim().length > 0) {
    url.searchParams.set(
      "response-content-disposition",
      `attachment; filename="${fileName}"`
    );
  } else {
    url.searchParams.set("response-content-disposition", "attachment");
  }

  return url.toString();
};
