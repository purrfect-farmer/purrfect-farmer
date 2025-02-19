import useCloudServerQuery from "@/hooks/useCloudServerQuery";
import { CgSpinner } from "react-icons/cg";
import { HiOutlineCloud } from "react-icons/hi2";

export default function CloudServerDisplay() {
  const serverQuery = useCloudServerQuery();
  const server = serverQuery.data;

  return (
    <div>
      {serverQuery.isPending ? (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      ) : serverQuery.isError ? (
        <p className="text-center text-red-500">Error...</p>
      ) : (
        <div className="flex items-center justify-center gap-2 text-green-500 truncate">
          <HiOutlineCloud className="w-4 h-4" /> {server.name}
        </div>
      )}
    </div>
  );
}
