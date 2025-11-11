export default function SpiderBalanceDisplay({ query }) {
  return (
    <div className="text-center">
      {query.isPending ? (
        "Loading balance..."
      ) : query.isError ? (
        "Error fetching balance."
      ) : (
        <span className="text-green-500">
          Available Balance:{" "}
          <strong>${parseFloat(query.data.wallet).toFixed(3)}</strong>
        </span>
      )}
    </div>
  );
}
