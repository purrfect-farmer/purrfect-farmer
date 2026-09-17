import { MdOutlineContentCopy, MdOutlineOpenInNew } from "react-icons/md";

import { cn } from "@/utils";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";

export const InfoButton = (props) => (
  <button
    {...props}
    className={cn(
      "shrink-0 p-2 rounded-xl",
      "text-neutral-500 dark:text-neutral-400",
      "hover:text-black dark:hover:text-white",
      "hover:bg-neutral-200 dark:hover:bg-neutral-600",
      "cursor-pointer transition-colors",
      props.className,
    )}
  />
);

export default function InfoRow({
  label,
  value,
  canCopy,
  valueClassName,
  rightContent,
  link,
}) {
  return (
    <div className="flex gap-2 p-2 items-center rounded-xl bg-neutral-100 dark:bg-neutral-700">
      <div className="flex flex-col gap-1 grow min-w-0">
        <span className="font-bold text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        <p
          className={cn(
            "wrap-break-word grow min-w-0 font-bold",
            valueClassName,
          )}
        >
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              <span>{value}</span>{" "}
              <MdOutlineOpenInNew className="shrink-0 size-3 inline-block" />
            </a>
          ) : (
            value
          )}
        </p>
      </div>
      {canCopy && (
        <InfoButton
          onClick={() => {
            copy(value);
            toast.success("Copied!");
          }}
        >
          <MdOutlineContentCopy className="size-4" />
        </InfoButton>
      )}
      {rightContent}
    </div>
  );
}
