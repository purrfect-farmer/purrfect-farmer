import useAuto from "@/hooks/useAuto";

export default function AutoHeader() {
  const { config } = useAuto();

  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      <img src={config.largeIcon} className="size-32" />
      <h1 className="font-turret-road text-center text-3xl text-orange-500">
        {config.title}
      </h1>
    </div>
  );
}
