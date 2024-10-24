import useGoatsUserQuery from "../hooks/useGoatsUserQuery";

export default function GoatsBalanceDisplay() {
  const query = useGoatsUserQuery();
  const result = query.data;

  return (
    <div className="flex flex-col gap-2 py-2">
      {query.isPending ? (
        <h4 className="text-center">Fetching Balance...</h4>
      ) : query.isError ? (
        <h4 className="text-center text-red-500">Failed to fetch Balance...</h4>
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
