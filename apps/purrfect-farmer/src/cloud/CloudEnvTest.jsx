import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi2";

import Button from "@/components/Button";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useCloudManagerEnvTestMutation from "@/hooks/useCloudManagerEnvTestMutation";

export default function CloudEnvTest({ service, getValues, disabled }) {
  const testMutation = useCloudManagerEnvTestMutation();
  const results = testMutation.data;

  const runTest = () =>
    testMutation
      .mutateAsync({ service, values: getValues() })
      .catch(() => toast.error("Test failed to run"));

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={runTest}
        disabled={disabled || testMutation.isPending}
      >
        {testMutation.isPending ? "Testing..." : "Test connection"}
      </Button>

      {results ? (
        <ul className="flex flex-col gap-1 text-sm">
          {results.map((result, index) => (
            <li
              key={index}
              className={cn(
                "flex items-start gap-2",
                result.ok ? "text-green-600" : "text-red-500",
              )}
            >
              {result.ok ? (
                <HiOutlineCheckCircle className="size-4 shrink-0 mt-0.5" />
              ) : (
                <HiOutlineXCircle className="size-4 shrink-0 mt-0.5" />
              )}
              <span className="min-w-0 break-words">
                <b>{result.label}:</b> {result.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
