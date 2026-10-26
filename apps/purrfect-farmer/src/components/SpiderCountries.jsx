import { LuArrowDownWideNarrow, LuArrowUpNarrowWide } from "react-icons/lu";
import { SPIDER_SORT_DIRECTION, SPIDER_SORT_KEY } from "@/constants/spiderSort";
import { cn } from "@/utils";
import Input from "./Input";
import Container from "./Container";
import Select from "./Select";

/** A searchable list of Spider countries, sorted by name or price */
export default function SpiderCountries({
  selectCountry,
  filteredCountries,
  searchTerm,
  setSearchTerm,
  sortKey,
  setSortKey,
  sortDir,
  toggleSortDir,
}) {
  /** Whether the countries are sorted ascending */
  const ascending = sortDir === SPIDER_SORT_DIRECTION.ASC;

  return (
    <div className="flex flex-col gap-2 grow min-w-0 min-h-0">
      <Container className="flex flex-col gap-2 p-0 px-2">
        <h2 className="col-span-full font-bold text-center">All Countries</h2>
        <Input
          type="search"
          placeholder="Search countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shrink-0"
        />
        <div className="flex items-center gap-2">
          <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <Select.Item value={SPIDER_SORT_KEY.NAME}>Sort by Name</Select.Item>
            <Select.Item value={SPIDER_SORT_KEY.PRICE}>
              Sort by Price
            </Select.Item>
          </Select>

          <button
            type="button"
            onClick={toggleSortDir}
            title={ascending ? "Ascending" : "Descending"}
            className={cn(
              "p-2.5 rounded-lg shrink-0",
              "text-neutral-500 dark:text-neutral-400",
              "bg-neutral-100 dark:bg-neutral-700",
              "hover:bg-neutral-200 dark:hover:bg-neutral-600",
              "cursor-pointer transition-colors",
            )}
          >
            {ascending ? (
              <LuArrowUpNarrowWide className="size-4" />
            ) : (
              <LuArrowDownWideNarrow className="size-4" />
            )}
          </button>
        </div>
      </Container>
      <div className="grow overflow-auto">
        <Container className="flex flex-col gap-2 p-0 px-2">
          {filteredCountries.map((item) => (
            <button
              type="button"
              key={`${item.group}-${item.code}`}
              onClick={() => selectCountry(item)}
              className={cn(
                "flex items-center gap-2",
                "p-2.5 text-left rounded-xl",
                "bg-neutral-100 dark:bg-neutral-700",
                "hover:bg-neutral-200 dark:hover:bg-neutral-600"
              )}
            >
              <span className="shrink-0">{item.emoji}</span>
              <span className="flex-1 min-w-0 font-bold truncate">
                {item.name}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs",
                  "text-emerald-500 dark:text-emerald-300",
                )}
              >
                {item.quantity} left
              </span>
              <span className="shrink-0 font-bold text-orange-500">
                ${item.price}
              </span>
            </button>
          ))}
        </Container>
      </div>
    </div>
  );
}
