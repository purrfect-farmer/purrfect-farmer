import Alert from "@/components/Alert";
import useAppContext from "@/hooks/useAppContext";
import useSeekerQuery from "@/hooks/useSeekerQuery";
import { CgSpinner } from "react-icons/cg";
import {
  HiOutlineBoltSlash,
  HiOutlineCheck,
  HiOutlineCloud,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function Seeker() {
  const { settings, dispatchAndConfigureSettings } = useAppContext();
  const seekerQuery = useSeekerQuery();

  return (
    <div className="flex flex-col gap-2">
      {settings.enableSeeker ? (
        <>
          {seekerQuery.isPending ? (
            <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
          ) : seekerQuery.isError ? (
            <p className="p-2 text-center text-red-500">
              Error fetching servers...
            </p>
          ) : (
            <>
              <Alert variant={"warning"}>
                Only select the server you have access to, your Cloud Server
                Address will be updated automatically upon reboots.
              </Alert>

              {/* List Servers */}
              {seekerQuery.data.map((server) => (
                <a
                  key={server.id}
                  role="button"
                  className={cn(
                    "bg-neutral-100 dark:bg-neutral-700",
                    "flex items-center gap-2 p-2 px-4 cursor-pointer rounded-xl"
                  )}
                  onClick={() =>
                    dispatchAndConfigureSettings("seekerId", server.id)
                  }
                >
                  {/* Icon */}
                  <HiOutlineCloud className="w-4 h-4 shrink-0" />

                  {/* Server Name */}
                  <span className="font-bold grow">{server.name}</span>

                  {server.id === settings.seekerId ? (
                    <HiOutlineCheck className="w-4 h-4 text-green-500 shrink-0" />
                  ) : null}
                </a>
              ))}
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <HiOutlineBoltSlash className="w-12 h-12" />
          <p className="text-center">Seeker not enabled</p>
        </div>
      )}
    </div>
  );
});
