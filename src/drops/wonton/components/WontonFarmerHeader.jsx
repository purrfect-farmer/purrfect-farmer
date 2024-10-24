import WontonIcon from "../assets/images/icon.png?format=webp&w=80";

export default function WontonFarmerHeader() {
  return (
    <div className="flex flex-col gap-1 py-4">
      <div className="flex items-center justify-center gap-2">
        <img src={WontonIcon} alt="Wonton Farmer" className="w-8 h-8" />
        <h1 className="font-bold">Wonton Farmer</h1>
      </div>
    </div>
  );
}
