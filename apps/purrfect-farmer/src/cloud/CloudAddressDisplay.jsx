import useAppContext from "@/hooks/useAppContext";

export default function CloudAddressDisplay() {
  const { settings } = useAppContext();

  return (
    <p className="p-2 text-center text-orange-800 bg-orange-100 rounded-lg">
      <span className="font-bold">Server</span>: {settings.cloudServer}
    </p>
  );
}
