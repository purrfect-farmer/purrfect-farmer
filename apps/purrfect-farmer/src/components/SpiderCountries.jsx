import { cn } from "@/lib/utils";
import Input from "./Input";

export default function SpiderCountries({
  selectCountry,
  filteredCountries,
  searchTerm,
  setSearchTerm,
}) {
  return (
    <div className="flex flex-col gap-2 grow min-w-0 min-h-0">
      <h2 className="col-span-full font-bold text-center">All Countries</h2>
      <Input
        type="search"
        placeholder="Search countries..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="shrink-0"
      />
      <div className="flex flex-col gap-2 grow overflow-auto px-2 -mx-2">
        {filteredCountries.map((item, index) => (
          <button
            key={index}
            onClick={() => selectCountry(item)}
            className={cn(
              "flex items-center gap-2",
              "p-2.5 text-left rounded-xl",
              "bg-neutral-100 dark:bg-neutral-700",
              "hover:bg-neutral-200 dark:hover:bg-neutral-600"
            )}
          >
            <span>{item.emoji}</span>
            <span className="flex-1 font-bold">{item.name}</span>
            <span className="font-bold text-orange-500">${item.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
