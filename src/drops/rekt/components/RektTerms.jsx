import FullSpinner from "@/components/FullSpinner";
import { memo } from "react";
import { useEffect } from "react";

import useRektAcceptDocumentMutation from "../hooks/useRektAcceptDocumentMutation";

export default memo(function RektTerms({ children }) {
  const acceptDocumentMutation = useRektAcceptDocumentMutation();

  /** Accept Document */
  useEffect(() => {
    acceptDocumentMutation.mutate();
  }, []);

  return acceptDocumentMutation.isSuccess ? children : <FullSpinner />;
});
