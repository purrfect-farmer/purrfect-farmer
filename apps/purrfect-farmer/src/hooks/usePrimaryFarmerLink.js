import useSharedStorageState from "./useSharedStorageState";

export default function usePrimaryFarmerLink(id) {
  const {
    storageKey,
    value: primaryFarmerLink,
    storeValue: storePrimaryFarmerLink,
  } = useSharedStorageState(`farmer-primary-link:${id}`);

  return {
    storageKey,
    primaryFarmerLink,
    storePrimaryFarmerLink,
  };
}
