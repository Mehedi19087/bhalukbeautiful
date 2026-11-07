import type { FacebookPublishResponse } from "./api-client";

export function getFacebookPublishFeedback(response: FacebookPublishResponse) {
  const results = response.results || [];
  const successful = results.find((result) => result.status === "SUCCESS");
  const postId = successful?.post_id || "";
  const postLink = postId ? `https://www.facebook.com/${postId}` : undefined;
  const errors = results.flatMap((result) => {
    if (result.status === "FAILED") {
      return [`পেজ ${result.page_id}: ${result.error || "ফটোকার্ড পোস্ট হয়নি।"}`];
    }
    if (result.comment_status !== "SUCCESS") {
      return [`পেজ ${result.page_id}: ফটোকার্ড পোস্ট হয়েছে। ${
        result.comment_error || (result.comment_status === "FAILED"
          ? "লিংক কমেন্ট হয়নি। আবার পোস্ট বাটন চাপলে শুধু কমেন্ট পাঠানো হবে।"
          : "লিংক কমেন্টের অবস্থা নিশ্চিত নয়। ফেসবুকে কমেন্ট দেখুন।")
      }`];
    }
    return [];
  });
  return {
    type: (results.length > 0 && errors.length === 0 ? "success" : "error") as "success" | "error",
    text: errors.length > 0 ? errors.join(" ") : results.length > 0
      ? "ফটোকার্ড এবং সংবাদের লিংক কমেন্ট সফলভাবে প্রকাশ হয়েছে।"
      : response.detail || "এই পোর্টালে সক্রিয় ফেসবুক পেজ যুক্ত নেই। পেজ যুক্ত করে আবার চেষ্টা করুন।",
    link: postLink,
  };
}
