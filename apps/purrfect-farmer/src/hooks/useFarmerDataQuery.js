import axios from "axios";

import useAppQuery from "./useAppQuery";

export default function useFarmerDataQuery() {
  return useAppQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,

    queryKey: ["app", "farmer", "data"],
    queryFn: ({ signal }) =>
      axios
        .get(`${import.meta.env.VITE_APP_FARMER_DATA_URL}?time=${Date.now()}`, {
          signal,
        })
        .then((res) => res.data),
  });
}
