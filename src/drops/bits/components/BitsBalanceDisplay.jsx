import useBitsUserQuery from "../hooks/useBitsUserQuery";

export default function BitsBalanceDisplay() {
  const query = useBitsUserQuery();
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
            {Intl.NumberFormat().format(result.coins)}
          </h3>
          <p className="flex items-center justify-center gap-2 text-green-500">
            {result.profile.fullName}
          </p>
        </>
      )}
    </div>
  );
}
