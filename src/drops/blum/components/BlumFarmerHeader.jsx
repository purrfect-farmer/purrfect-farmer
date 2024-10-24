import BlumIcon from "../assets/images/icon.png?format=webp&w=80";

export default function BlumFarmerHeader() {
  return (
    <div className="flex flex-col gap-1 py-4 border-b border-gray-500">
      <div className="flex items-center justify-center">
        <img src={BlumIcon} alt="Blum Farmer" className="w-8 h-8" />
        <h1 className="font-bold">Blum Farmer</h1>
      </div>
    </div>
  );
}
