import useReferralLink from "@/hooks/useReferralLink";
import { CgSpinnerAlt } from "react-icons/cg";
import { IoCopyOutline } from "react-icons/io5";

export default function FarmerHeader({ title, icon, referralLink }) {
  const copyReferralLink = useReferralLink(referralLink);

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
