import CloudContext from "@/contexts/CloudContext";
import { useContext } from "react";

export default function useCloudContext() {
  return useContext(CloudContext);
}
