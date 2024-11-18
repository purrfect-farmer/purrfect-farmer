import useMatchQuestUserQuery from "../hooks/useMatchQuestUserQuery";

export default function MatchQuestBalanceDisplay() {
  const query = useMatchQuestUserQuery();

  return (
    <div className="py-2 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="text-xl font-bold">
            {Intl.NumberFormat().format(query.data["Balance"] / 1000)}
          </h3>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
}
