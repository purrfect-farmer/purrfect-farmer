import Alert from "@/components/Alert";
import Farmer from "@/components/Farmer";
import FarmerHeader from "@/components/FarmerHeader";
import useDropFarmer from "@/hooks/useDropFarmer";
import useFarmerContext from "@/hooks/useFarmerContext";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";

const CloudFarmerContent = () => {
  const context = useFarmerContext();
  const { id, farmer, api, telegramWebApp } = context;
  const referralLinkQuery = useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryKey: [id, "referral-link"],
    queryFn: () => farmer.getReferralLink(api, telegramWebApp, context),
  });

  return (
    <div className="flex flex-col gap-2 p-4">
      <FarmerHeader referralLink={referralLinkQuery.data} />
      <Alert variant={"info"}>
        This is a Cloud-Only farmer, tasks will be completed on Cloud.
      </Alert>
    </div>
  );
};

function CloudFarmer() {
  const farmer = useDropFarmer();
  return (
    <Farmer farmer={farmer}>
      <CloudFarmerContent />
    </Farmer>
  );
}

export default memo(CloudFarmer);
