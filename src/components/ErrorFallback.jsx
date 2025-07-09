import ShockedCat from "@/assets/images/shocked-cat.png?format=webp";
import { memo } from "react";

export default memo(function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 p-4 grow"
    >
      {/* Image */}
      <img src={ShockedCat} className="h-28" />

      {/* Prompt */}
      <h4 className="text-3xl font-turret-road">Cat-astrophe!</h4>

      {/* Message */}
      <p className="w-full max-w-xs p-4 text-center text-red-800 bg-red-100 rounded-lg">
        {error?.message || "Something went wrong"}
      </p>

      {/* Reset Button */}
      <button
        onClick={resetErrorBoundary}
        className="w-full max-w-xs px-4 py-2 text-white bg-orange-500 rounded-lg"
      >
        Reset
      </button>
    </div>
  );
});
