import useFarmerContext from "@/hooks/useFarmerContext";

export default function WontonUsernameDisplay() {
  const { userRequest } = useFarmerContext();

  return (
    <div className="py-2">
      <h4 className="font-bold text-center text-orange-500">
        {!userRequest.data
          ? "Detecting username..."
          : userRequest.data.username}
      </h4>
    </div>
  );
}
