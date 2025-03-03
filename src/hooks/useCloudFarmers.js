import useCloudFarmersQuery from "./useCloudFarmersQuery";
import { useMemo } from "react";

export default function useCloudFarmers() {
  const query = useCloudFarmersQuery();

  return useMemo(() => query.data || [], [query.data]);
}
