import type { AdSlot } from "@/lib/api-client";

export const AD_SLOT_CONFIG: Record<
  AdSlot,
  { label: string; width: number; height: number; description: string }
> = {
  BANNER_TOP: {
    label: "হোমপেজ টপ ব্যানার",
    width: 970,
    height: 90,
    description: "হোমপেজের হেডারে সম্পূর্ণ ৯৭০×৯০ আর্টওয়ার্ক হিসেবে দেখাবে",
  },
  SIDEBAR: {
    label: "সাইডবার বিজ্ঞাপন",
    width: 300,
    height: 250,
    description: "হোমপেজ ও সংবাদ পাতার ডান পাশের কলামে দেখাবে",
  },
  IN_ARTICLE: {
    label: "আর্টিকেলের ভেতরের ব্যানার",
    width: 728,
    height: 90,
    description: "সংবাদ পাতার তৃতীয় অনুচ্ছেদের পরে দেখাবে",
  },
};

const MAX_SOURCE_SIZE = 10 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  const sourceUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("ছবিটি পড়া যাচ্ছে না। অন্য একটি ছবি দিন।"));
    };
    image.src = sourceUrl;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Produces an exact-size, high-quality ad creative without stretching the
 * source. Images with a very different aspect ratio are shown in full over a
 * soft background made from the same image.
 */
export async function prepareAdImage(file: File, slot: AdSlot): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("শুধু JPG, PNG অথবা WebP ছবি আপলোড করুন।");
  }
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error("ছবির সাইজ সর্বোচ্চ ১০ MB হতে পারবে।");
  }

  const image = await loadImage(file);
  const { width, height } = AD_SLOT_CONFIG[slot];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি প্রস্তুত করা যাচ্ছে না।");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  const ratioDifference = Math.abs(sourceRatio - targetRatio) / targetRatio;

  if (ratioDifference <= 0.08) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    context.drawImage(
      image,
      (width - drawnWidth) / 2,
      (height - drawnHeight) / 2,
      drawnWidth,
      drawnHeight,
    );
  } else {
    const backgroundScale =
      Math.max(width / image.naturalWidth, height / image.naturalHeight) * 1.08;
    const backgroundWidth = image.naturalWidth * backgroundScale;
    const backgroundHeight = image.naturalHeight * backgroundScale;

    context.save();
    context.filter = `blur(${Math.max(10, Math.round(height * 0.12))}px)`;
    context.globalAlpha = 0.38;
    context.drawImage(
      image,
      (width - backgroundWidth) / 2,
      (height - backgroundHeight) / 2,
      backgroundWidth,
      backgroundHeight,
    );
    context.restore();

    context.fillStyle = "rgba(255, 255, 255, 0.68)";
    context.fillRect(0, 0, width, height);

    const padding = Math.max(5, Math.round(Math.min(width, height) * 0.07));
    const foregroundScale = Math.min(
      (width - padding * 2) / image.naturalWidth,
      (height - padding * 2) / image.naturalHeight,
    );
    const foregroundWidth = image.naturalWidth * foregroundScale;
    const foregroundHeight = image.naturalHeight * foregroundScale;

    context.drawImage(
      image,
      (width - foregroundWidth) / 2,
      (height - foregroundHeight) / 2,
      foregroundWidth,
      foregroundHeight,
    );
  }

  const webpBlob = await canvasBlob(canvas, "image/webp", 0.92);
  const blob = webpBlob ?? (await canvasBlob(canvas, "image/jpeg", 0.94));
  if (!blob) throw new Error("ছবিটি প্রস্তুত করা যায়নি। আবার চেষ্টা করুন।");

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `ad-${slot.toLowerCase()}-${Date.now()}.${extension}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}
