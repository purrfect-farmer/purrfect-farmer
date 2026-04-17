import useSharedStorageState from "./useSharedStorageState";

export default function usePrimaryFarmerUserId(id) {
  const {
    storageKey,
    value: primaryFarmerUserId,
    storeValue: storePrimaryFarmerUserId,
  } = useSharedStorageState(`farmer-primary-user-id:${id}`, null);

  return {
    storageKey,
    primaryFarmerUserId,
    storePrimaryFarmerUserId,
  };
}
