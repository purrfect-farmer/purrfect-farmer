import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useCloudManagerMemberSubscriptionMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "manager", "member", "subscription"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/manager/members/subscription", data)
        .then((res) => res.data),
  });
}
