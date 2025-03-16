import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

const ALERT_ICONS = {
  info: HiOutlineInformationCircle,
  warning: HiOutlineExclamationTriangle,
  danger: HiOutlineXCircle,
  success: HiOutlineCheckCircle,
};
export default function Alert({ as: Component = "div", variant, ...props }) {
  const Icon = ALERT_ICONS[variant];
  return (
    <Component
      {...props}
      className={cn(
        "px-4 py-2 rounded-xl",
        "flex items-center gap-4",

        {
          info: [
            "text-blue-800 dark:text-blue-500",
            "bg-blue-100",
            "dark:bg-blue-500/20",
          ],
          warning: [
            "text-orange-800 dark:text-orange-500",
            "bg-orange-100",
            "dark:bg-orange-500/20",
          ],
          danger: [
            "text-red-800 dark:text-red-500",
            "bg-red-100",
            "dark:bg-red-500/20",
          ],
          success: [
            "text-green-800 dark:text-green-500",
            "bg-green-100",
            "dark:bg-green-500/20",
          ],
        }[variant],
        props.className
      )}
    >
      <Icon className={cn("shrink-0 size-6")} />
      <p className="grow min-w-0 min-h-0">{props.children}</p>
    </Component>
  );
}
