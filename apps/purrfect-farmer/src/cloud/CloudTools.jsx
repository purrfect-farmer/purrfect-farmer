import { FaBan, FaDoorOpen, FaToolbox, FaUserSlash } from "react-icons/fa6";
import {
  HiOutlineKey,
  HiOutlineServerStack,
  HiOutlineWifi,
} from "react-icons/hi2";
import { LiaPlaySolid, LiaUserNinjaSolid } from "react-icons/lia";

import BottomDialog from "@/components/BottomDialog";
import BottomDialogTools from "@/partials/BottomDialogTools";
import Button from "@/components/Button";
import CloudIcon from "@/assets/images/cloud.png?format=webp&w=128";
import CloudPasswordUpdate from "./CloudPasswordUpdate";
import CloudServerBackup from "./CloudServerBackup";
import CloudServerUpdate from "./CloudServerUpdate";
import { Dialog } from "radix-ui";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { useCallback } from "react";
import useCloudManagerActivateAllFarmersMutation from "@/hooks/useCloudManagerActivateAllFarmersMutation";
import useCloudManagerUpdateProxiesMutation from "@/hooks/useCloudManagerUpdateProxiesMutation";
import useCloudManagerKickAllMembersMutation from "@/hooks/useCloudManagerKickAllMembersMutation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CloudTools() {
  const { cloudAuth } = useAppContext();
  const queryClient = useQueryClient();
  const activateAllFarmersMutation =
    useCloudManagerActivateAllFarmersMutation();
  const updateProxiesMutation = useCloudManagerUpdateProxiesMutation();
  const kickAllMembersMutation = useCloudManagerKickAllMembersMutation();

  const [openPasswordUpdate, setOpenPasswordUpdate] = useState(false);
  const [openServerUpdate, setOpenServerUpdate] = useState(false);
  const [openBackup, setOpenBackup] = useState(false);

  /** Activate All Farmers */
  const activateAllFarmers = () => {
    toast.promise(activateAllFarmersMutation.mutateAsync(), {
      loading: "Activating farmers...",
      success: "Successfully activated farmers!",
      error: "Failed to activate farmers!",
    });
  };

  /** Update Proxies */
  const updateProxies = () => {
    toast.promise(updateProxiesMutation.mutateAsync(), {
      loading: "Updating proxies...",
      success: "Successfully updated proxies!",
      error: "Failed to update proxies!",
    });
  };

  /** Kick All Members */
  const kickAllMembers = () => {
    toast.promise(kickAllMembersMutation.mutateAsync(), {
      loading: "Kicking all members...",
      success: "Successfully kicked all members!",
      error: "Failed to kick all members!",
    }).finally(() => {
      queryClient.refetchQueries({ queryKey: ["app", "cloud"] });
    });
  };

  /** Logout */
  const logout = useCallback(() => {
    cloudAuth.removeToken();
  }, [cloudAuth.removeToken]);

  return (
    <>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button>
            <FaToolbox className="size-4" /> Open server tools
          </Button>
        </Dialog.Trigger>
        <BottomDialog
          title={"Manager"}
          description={"Server tools"}
          icon={CloudIcon}
        >
          <BottomDialogTools.Container>
            {/* Server */}
            <BottomDialogTools.Header>Server</BottomDialogTools.Header>

            {/* Backup / Import */}
            <BottomDialogTools.Button
              icon={HiOutlineServerStack}
              onClick={() => setOpenBackup(true)}
            >
              Backup / Import
            </BottomDialogTools.Button>

            {/* Update Server */}
            <BottomDialogTools.Button
              icon={HiOutlineWifi}
              onClick={() => setOpenServerUpdate(true)}
            >
              Update Server
            </BottomDialogTools.Button>

            {/* Farmers */}
            <BottomDialogTools.Header>Farmers</BottomDialogTools.Header>

            {/* Activate all farmers */}
            <BottomDialogTools.Button
              icon={LiaPlaySolid}
              onClick={activateAllFarmers}
            >
              Activate all farmers
            </BottomDialogTools.Button>

            {/* Members */}
            <BottomDialogTools.Header>Members</BottomDialogTools.Header>

            {/* Update Proxies */}
            <BottomDialogTools.Button
              icon={LiaUserNinjaSolid}
              onClick={updateProxies}
            >
              Update Proxies
            </BottomDialogTools.Button>

            {/* Kick all members */}
            <BottomDialogTools.Button
              icon={FaBan}
              onClick={kickAllMembers}
            >
              Kick all members
            </BottomDialogTools.Button>

            {/* User */}
            <BottomDialogTools.Header>User</BottomDialogTools.Header>
            {/* Password */}
            <BottomDialogTools.Button
              icon={HiOutlineKey}
              onClick={() => setOpenPasswordUpdate(true)}
            >
              Password
            </BottomDialogTools.Button>
            {/* Logout */}
            <BottomDialogTools.Button icon={FaDoorOpen} onClick={logout}>
              Logout
            </BottomDialogTools.Button>
          </BottomDialogTools.Container>
        </BottomDialog>
      </Dialog.Root>

      {/* Server Update */}
      <Dialog.Root open={openServerUpdate} onOpenChange={setOpenServerUpdate}>
        <CloudServerUpdate />
      </Dialog.Root>

      {/* Backup and restore */}
      <Dialog.Root open={openBackup} onOpenChange={setOpenBackup}>
        <CloudServerBackup />
      </Dialog.Root>

      {/* Password */}
      <Dialog.Root
        open={openPasswordUpdate}
        onOpenChange={setOpenPasswordUpdate}
      >
        <CloudPasswordUpdate />
      </Dialog.Root>
    </>
  );
}
