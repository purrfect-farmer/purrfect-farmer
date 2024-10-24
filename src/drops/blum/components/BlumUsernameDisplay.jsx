import useBlumUserQuery from "../hooks/useBlumUserQuery";

export default function BlumUsernameDisplay() {
  const query = useBlumUserQuery();

  return (
    <div className="py-2">
      <h4 className="text-center">
        {query.isPending
          ? "Fetching username..."
          : query.isSuccess
          ? query.data.username
          : "Error..."}
      </h4>
    </div>
  );
}
