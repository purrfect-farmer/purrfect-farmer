import useFarmerContext from "@/hooks/useFarmerContext";
import useReferralLink from "@/hooks/useReferralLink";
import useStorageState from "@/hooks/useStorageState";
import { CgSpinnerAlt } from "react-icons/cg";
import { IoCopyOutline } from "react-icons/io5";
import { useEffect } from "react";

export default function FarmerHeader({ title, icon, referralLink }) {
  const { id } = useFarmerContext();

  /** Chrome Storage of Referral Link */
  const { value: currentReferralLink, storeValue: storeReferralLink } =
    useStorageState(`farmer-referral-link:${id}`, null);

  /** Copy Referral Link */
  const copyReferralLink = useReferralLink(referralLink);

  /** Store Referral Link */
  useEffect(() => {
    if (referralLink && referralLink !== currentReferralLink) {
      storeReferralLink(referralLink);
    }
  }, [referralLink, currentReferralLink, storeReferralLink]);

  return (
    <div
      className="flex items-center justify-center gap-2 cursor-pointer"
      onClick={copyReferralLink}
    >
      <img src={icon} alt={title} className="w-8 h-8 rounded-full" />
      <h1 className="font-bold">{title}</h1>
      {referralLink ? (
        <IoCopyOutline />
      ) : (
        <CgSpinnerAlt className="animate-spin" />
      )}
    </div>
  );
}
