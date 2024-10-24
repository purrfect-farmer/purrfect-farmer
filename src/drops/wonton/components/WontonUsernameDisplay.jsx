import useWontonUserQuery from "../hooks/useWontonUserQuery";

export default function WontonUsernameDisplay() {
  const query = useWontonUserQuery();

  return (
    <div className="py-2">
      <h4 className="font-bold text-center text-orange-500">
        {query.isPending
          ? "Fetching username..."
          : query.isSuccess
          ? query.data.username
          : "Error..."}
      </h4>
    </div>
  );
}
