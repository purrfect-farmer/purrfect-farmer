import useAutoCloudMutation from "./useAutoCloudMutation";

export default function useAutoCloudCancellationMutation() {
  return useAutoCloudMutation("cancel");
}
