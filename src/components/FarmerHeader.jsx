import useFarmerContext from "@/hooks/useFarmerContext";
import useReferralLink from "@/hooks/useReferralLink";
import useStorageState from "@/hooks/useStorageState";
import { CgSpinnerAlt } from "react-icons/cg";
import { IoCopyOutline } from "react-icons/io5";
import { customLogger } from "@/lib/utils";
import { useEffect } from "react";

export default function FarmerHeader({ referralLink }) {
  const { id, farmer } = useFarmerContext();
  const { icon, title } = farmer;

  /** Chrome Storage of Referral Link */
  const { value: currentReferralLink, storeValue: storeReferralLink } =
    useStorageState(`farmer-referral-link:${id}`, null);

  /** Copy Referral Link */
  const copyReferralLink = useReferralLink(referralLink);

  /** Store Referral Link */
  useEffect(() => {
    /** Log Link */
    customLogger(`${id.toUpperCase()} - REFERRAL LINK`, referralLink);

    if (referralLink && referralLink !== currentReferralLink) {
      storeReferralLink(referralLink);
    }
  }, [id, referralLink, currentReferralLink, storeReferralLink]);

  return (
    <div
      className="flex items-center justify-center gap-2 cursor-pointer"
      onClick={copyReferralLink}
    >
      <img src={icon} alt={title} className="w-8 h-8 rounded-full" />
      <h1 className="font-bold">{title} Farmer</h1>
      {referralLink ? (
        <IoCopyOutline />
      ) : (
        <CgSpinnerAlt className="animate-spin" />
      )}
    </div>
  );
}
