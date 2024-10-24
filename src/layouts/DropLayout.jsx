import { HiOutlineArrowLeft } from "react-icons/hi2";
import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function DropLayout() {
  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex items-center gap-2 p-2 font-bold shrink-0">
        <Link
          to="/"
          className={cn(
            "flex items-center justify-center gap-2",
            "rounded-full w-9 h-9",
            "hover:bg-neutral-100"
          )}
        >
          <HiOutlineArrowLeft />
        </Link>
        Return
      </div>
      <div className="flex flex-col min-w-0 min-h-0 grow">
        <Outlet />
      </div>
    </div>
  );
}
