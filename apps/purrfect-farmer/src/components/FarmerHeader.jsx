import { CgSpinnerAlt } from "react-icons/cg";
import { HiStar } from "react-icons/hi2";
import { IoCopyOutline } from "react-icons/io5";
import useFarmerContext from "@/hooks/useFarmerContext";
import useReferralLink from "@/hooks/useReferralLink";

export default function FarmerHeader({ isPrimary, referralLink }) {
  const { farmer } = useFarmerContext();
  const { icon, title } = farmer;

  /** Copy Referral Link */
  const copyReferralLink = useReferralLink(referralLink);

  return (
    <div
      className="flex items-center justify-center gap-2 cursor-pointer"
      onClick={copyReferralLink}
    >
      {/* Icon */}
      <img src={icon} alt={title} className="w-8 h-8 shrink-0 rounded-full" />

      {/* Indicator for primary account */}
      {isPrimary && <HiStar className="shrink-0 text-lime-500" />}

      {/* Title */}
      <h1 className="font-bold min-w-0">{title} Farmer</h1>

      {/* Copy indicator */}
      {referralLink ? (
        <IoCopyOutline className="shrink-0" />
      ) : referralLink !== null ? (
        <CgSpinnerAlt className="shrink-0 animate-spin" />
      ) : null}
    </div>
  );
}
