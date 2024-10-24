import { cn } from "@/lib/utils";

import usePumpadUserQuery from "../hooks/usePumpadUserQuery";

export default function PumpadUsernameDisplay() {
  const query = usePumpadUserQuery();

  return (
    <h4 className={cn("text-center", query.isError ? "text-red-500" : null)}>
      {query.isPending
        ? "Fetching username..."
        : query.isSuccess
        ? query.data["user_name"]
        : "Error..."}
    </h4>
  );
}
