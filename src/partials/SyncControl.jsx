import Toggle from "@/components/Toggle";
import useAppContext from "@/hooks/useAppContext";

export default function SyncControl() {
  const { socket } = useAppContext();

  return (
    <label className="flex items-center justify-center gap-2 p-2 bg-white border-t cursor-pointer shrink-0">
      Sync{" "}
      <Toggle
        checked={socket.syncing}
        onChange={(ev) => {
          socket.setSyncing(ev.target.checked);
        }}
      />
    </label>
  );
}
