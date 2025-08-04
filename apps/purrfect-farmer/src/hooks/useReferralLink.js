import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import { useCallback } from "react";

export default function useReferralLink(link) {
  return useCallback(() => {
    if (link) {
      copy(link);
      toast.success("Copied referral link!");
    }
  }, [link]);
}
