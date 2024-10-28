import Toggle from "@/components/Toggle";
import useAppContext from "@/hooks/useAppContext";

export default function SyncControl() {
  const { socket } = useAppContext();

  return (
    <label className="flex items-center justify-center gap-2 p-2 bg-white cursor-pointer grow">
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
