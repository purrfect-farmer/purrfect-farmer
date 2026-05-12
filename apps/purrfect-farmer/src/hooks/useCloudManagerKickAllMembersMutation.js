import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerKickAllMembersMutation() {
    const { cloudBackend } = useAppContext();

    return useMutation({
        mutationKey: ["app", "cloud", "manager", "members", "all", "kick"],
        mutationFn: () =>
            cloudBackend.post("/api/manager/members/kick/all").then((res) => res.data),
    });
}
