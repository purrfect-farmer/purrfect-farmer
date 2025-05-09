import AccountContext from "@/contexts/AccountContext";
import { useContext } from "react";

export default function useAccountContext() {
  return useContext(AccountContext);
}
