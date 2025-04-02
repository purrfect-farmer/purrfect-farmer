import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useCloudLogoutMutation from "@/hooks/useCloudLogoutMutation";
import useCloudUserQuery from "@/hooks/useCloudUserQuery";
import { Dialog } from "radix-ui";
import { useCallback } from "react";

import CloudPasswordUpdate from "./CloudPasswordUpdate";

export default function CloudUserDisplay() {
  const { cloudAuth } = useAppContext();
  const logoutMutation = useCloudLogoutMutation();
  const userQuery = useCloudUserQuery();
  const user = userQuery.data;

  const logout = useCallback(() => {
    toast.promise(
      logoutMutation.mutateAsync(null, {
        onSuccess() {
          cloudAuth.removeToken();
        },
      }),
      {
        success: "Successfully logged out...",
        error: "Error...",
        loading: "Logging out...",
      }
    );
  }, [logoutMutation.mutateAsync, cloudAuth.removeToken]);

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

          <div className="grid grid-cols-2 gap-2 mx-auto my-2 font-bold">
            <Dialog.Root>
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
