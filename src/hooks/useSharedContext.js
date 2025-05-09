import SharedContext from "@/contexts/SharedContext";
import { useContext } from "react";

export default function useSharedContext() {
  return useContext(SharedContext);
}
