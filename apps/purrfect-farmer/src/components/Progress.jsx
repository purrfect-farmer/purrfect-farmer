import { Progress as ProgressPrimitive } from "radix-ui";

const Progress = ({ current, max }) => {
  return (
    <>
      <ProgressPrimitive.Root
        value={current}
        className="w-full h-2 overflow-hidden border border-neutral-300 dark:border-neutral-700 rounded-full"
      >
        <ProgressPrimitive.Indicator
          className="bg-orange-500 h-full transition-all duration-500"
          style={{ width: `${(current / max) * 100}%` }}
        />
      </ProgressPrimitive.Root>
      <p className="text-center text-orange-500">
        {current} / {max}
      </p>
    </>
  );
};

export { Progress };
