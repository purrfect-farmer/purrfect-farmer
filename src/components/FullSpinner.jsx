import { CgSpinner } from "react-icons/cg";

export default function FullSpinner() {
  return (
    <div className="flex items-center justify-center p-4 grow">
      <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
    </div>
  );
}
