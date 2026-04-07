import ATFIcon from "@/assets/images/atf.png?format=webp&w=192";

export default function ATFAutoHeader() {
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      <img src={ATFIcon} className="size-24" />
      <h1 className="font-turret-road text-center text-3xl text-orange-500">
        ATF Auto
      </h1>
    </div>
  );
}
