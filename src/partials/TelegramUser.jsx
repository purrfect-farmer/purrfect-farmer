import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { memo, useCallback } from "react";

export default memo(function TelegramUser({ user, ...props }) {
  /** Copy Username */
  const copyUsername = useCallback(() => {
    copy(`@${user?.username}`);
    toast.success("Username was copied!");
  }, [user?.username]);

  /** Copy User Id */
  const copyUserId = useCallback(() => {
    copy(user?.id);
    toast.success("User ID was copied!");
  }, [user?.id]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full bg-black",
        props.className
      )}
    >
      {/* User Photo */}
      <img
        className="rounded-full size-10 shrink-0"
        src={user?.["photo_url"]}
      />

      <div className="flex flex-col min-w-0 min-h-0 grow pr-2 gap-1">
        {/* First and Last Name */}
        <p className="font-bold text-purple-500 truncate">
          {user?.["first_name"] || user?.["last_name"]
            ? `${user?.["first_name"] || ""} ${user?.["last_name"] || ""}`
            : " Telegram User"}
        </p>

        {/* Username */}
        {user?.username ? (
          <p onClick={copyUsername} className="text-yellow-500 truncate">
            @{user?.username}
          </p>
        ) : null}

        {/* User ID */}
        <p onClick={copyUserId} className="truncate text-lime-500">
          ID: {user?.id}
        </p>
      </div>
    </div>
  );
});
