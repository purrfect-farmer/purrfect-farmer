import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import useCloudUserQuery from "@/hooks/useCloudUserQuery";
import CloudPasswordUpdate from "./CloudPasswordUpdate";
import * as Dialog from "@radix-ui/react-dialog";
import useCloudLogoutMutation from "@/hooks/useCloudLogoutMutation";
import { useCallback } from "react";
import toast from "react-hot-toast";
import useCloudContext from "@/hooks/useCloudContext";

export default function CloudUserDisplay() {
  const { cloudAuth } = useCloudContext();
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
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <img src={UserIcon} className="w-20 h-20 rounded-full shrink-0" />

          <div className="flex flex-col min-w-0 min-h-0 grow">
            <h3 className="text-xl font-bold font-turret-road">{user.name}</h3>
            <p className="text-purple-500">@{user.username}</p>
            <p className="text-lime-500">{user.email}</p>

            <div className="grid grid-cols-2 gap-2 my-2 font-bold">
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
        </div>
      )}
    </div>
  );
}
