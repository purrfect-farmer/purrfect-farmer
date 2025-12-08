import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import useAppContext from "@/hooks/useAppContext";
import useCloudManagerUserQuery from "@/hooks/useCloudManagerUserQuery";
import { Dialog } from "radix-ui";
import { useCallback } from "react";

import CloudPasswordUpdate from "./CloudPasswordUpdate";
import useLocationToggle from "@/hooks/useLocationToggle";
import CloudServerUpdate from "./CloudServerUpdate";

export default function CloudUserDisplay() {
  const { cloudAuth } = useAppContext();
  const userQuery = useCloudManagerUserQuery();
  const user = userQuery.data;

  const logout = useCallback(() => {
    cloudAuth.removeToken();
  }, [cloudAuth.removeToken]);

  const [openPasswordUpdate, setOpenPasswordUpdate] = useLocationToggle(
    "cloud-password-update"
  );

  const [openServerUpdate, setOpenServerUpdate] = useLocationToggle(
    "cloud-server-update"
  );

  return (
    <div>
      {userQuery.isPending ? (
        <p className="text-center">Fetching user...</p>
      ) : userQuery.isError ? (
        <p className="text-center text-red-500">Error...</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 p-3 text-white rounded-full bg-neutral-900">
            {/* User Photo */}
            <img className="rounded-full w-11 h-11 shrink-0" src={UserIcon} />

            <div className="flex flex-col min-w-0 min-h-0 grow">
              {/* User Name */}
              <p className="text-lg font-bold truncate font-turret-road">
                {user.name}
              </p>

              {/* User Email */}
              <p className="truncate text-lime-500">{user.email}</p>

              {/* Username */}
              <p className="text-yellow-500 truncate ">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mx-auto my-2 font-bold">
            <Dialog.Root
              open={openServerUpdate}
              onOpenChange={setOpenServerUpdate}
            >
              <Dialog.Trigger className="text-orange-500">
                Server
              </Dialog.Trigger>

              <CloudServerUpdate />
            </Dialog.Root>

            <Dialog.Root
              open={openPasswordUpdate}
              onOpenChange={setOpenPasswordUpdate}
            >
              <Dialog.Trigger className="text-blue-500">
                Password
              </Dialog.Trigger>

              <CloudPasswordUpdate />
            </Dialog.Root>

            <button onClick={logout} className="text-red-500">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
