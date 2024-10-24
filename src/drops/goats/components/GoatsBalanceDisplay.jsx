import useFarmerContext from "@/hooks/useFarmerContext";

export default function GoatsBalanceDisplay() {
  const { userRequest } = useFarmerContext();
  const result = userRequest.data;

  return (
    <div className="flex flex-col gap-2 py-2">
      {!result ? (
        <h4 className="text-center">Detecting Balance...</h4>
      ) : (
        <>
          <h3 className="text-2xl font-bold text-center">
            {Intl.NumberFormat().format(result.balance)}
          </h3>
          <p
            className="flex items-center justify-center gap-2 text-neutral-500"
            title="Tickets"
          >
            {result["user_name"]}
          </p>
        </>
      )}
    </div>
  );
}
