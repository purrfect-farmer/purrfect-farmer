import useFarmerContext from "@/hooks/useFarmerContext";

export default function BlumUsernameDisplay() {
  const { userRequest } = useFarmerContext();

  return (
    <div className="py-2">
      <h4 className="text-center">
        {!userRequest.data
          ? "Detecting username..."
          : userRequest.data.username}
      </h4>
    </div>
  );
}
