import useAppContext from "@/hooks/useAppContext";
import toast from "react-hot-toast";
import SpiderKeyInput from "@/components/SpiderKeyInput";
import SpiderBalanceDisplay from "@/components/SpiderBalanceDisplay";
import SpiderAccountsForm from "@/components/SpiderAccountsForm";
import SpiderCountries from "@/components/SpiderCountries";
import { useMemo } from "react";
import { getCountryData } from "countries-list";
import { getEmojiFlag } from "countries-list";
import { naturalCompare } from "@purrfect/shared/lib/naturalCompare";
import { useQuery } from "@tanstack/react-query";
import Spider from "@/lib/Spider";
import useMirroredState from "@/hooks/useMirroredState";
import { SPIDER_SORT_DIRECTION, SPIDER_SORT_KEY } from "@/constants/spiderSort";

export default function SpiderManager() {
  const { sharedSettings } = useAppContext();

  const spiderApiKey = sharedSettings.spiderApiKey;
  const [searchTerm, setSearchTerm, dispatchAndSetSearchTerm] =
    useMirroredState("spider.search-term", "");
  const [selectedCountry, setSelectedCountry, dispatchAndSetSelectedCountry] =
    useMirroredState("spider.selected-country", null);
  const [sortKey, setSortKey, dispatchAndSetSortKey] = useMirroredState(
    "spider.sort-key",
    SPIDER_SORT_KEY.NAME,
  );
  const [sortDir, setSortDir, dispatchAndSetSortDir] = useMirroredState(
    "spider.sort-dir",
    SPIDER_SORT_DIRECTION.ASC,
  );

  /* Balance Query */
  const balanceQuery = useQuery({
    queryKey: ["spider-balance", spiderApiKey],
    queryFn: async () => {
      return new Spider(spiderApiKey).getBalance();
    },
    refetchInterval: 60_000,
    enabled: Boolean(spiderApiKey),
  });

  /* Balance */
  const balance = balanceQuery.data?.wallet || 0;

  /* Countries Query */
  const countriesQuery = useQuery({
    queryKey: ["spider-countries", spiderApiKey],
    queryFn: async () => {
      return new Spider(spiderApiKey).getCountries();
    },
    refetchInterval: 60_000,
    enabled: Boolean(spiderApiKey),
  });

  /* All Countries */
  const allCountries = useMemo(() => {
    try {
      if (!countriesQuery.data) return [];

      /* Quantities are returned under the misspelled "cuantity" key */
      const quantities =
        countriesQuery.data.cuantity || countriesQuery.data.quantity || {};

      return Object.entries(countriesQuery.data.countries).reduce(
        (result, [group, list]) =>
          result.concat(
            Object.entries(list).map(([code, price]) => {
              const country = getCountryData(code);
              const emoji = getEmojiFlag(code);
              const name = country?.name || code;
              const quantity = quantities?.[group]?.[code] ?? 0;
              return {
                code,
                price: parseFloat(price),
                quantity,
                emoji,
                name,
                group,
              };
            })
          ),
        []
      );
    } catch (e) {
      console.error("Error processing countries:", e);
      return [];
    }
  }, [countriesQuery.data]);

  /* Available Countries (Group 1) */
  const availableCountries = useMemo(() => {
    return allCountries.filter((item) => item.group === "1");
  }, [allCountries]);

  /* Filtered Countries, sorted by name or price */
  const filteredCountries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const direction = sortDir === SPIDER_SORT_DIRECTION.DESC ? -1 : 1;

    return availableCountries
      .filter((item) => item.name.toLowerCase().includes(term))
      .sort((a, b) => {
        const comparison =
          sortKey === SPIDER_SORT_KEY.PRICE
            ? a.price - b.price
            : naturalCompare(a.name, b.name);

        return comparison * direction;
      });
  }, [availableCountries, searchTerm, sortKey, sortDir]);

  /** Toggle the sort direction */
  const toggleSortDir = () => {
    dispatchAndSetSortDir(
      sortDir === SPIDER_SORT_DIRECTION.ASC
        ? SPIDER_SORT_DIRECTION.DESC
        : SPIDER_SORT_DIRECTION.ASC,
    );
  };

  /** Select Country */
  const selectCountry = (item) => {
    if (item.quantity <= 0) {
      toast.error("This country is out of stock.");
      return;
    }
    if (item.price > balance) {
      toast.error("Insufficient balance for this country.");
      return;
    }
    dispatchAndSetSelectedCountry(item);
  };

  return (
    <div className="flex flex-col gap-2 py-2 grow min-w-0 min-h-0">
      <SpiderKeyInput />

      {spiderApiKey ? (
        <>
          <SpiderBalanceDisplay query={balanceQuery} />
          {selectedCountry ? (
            <SpiderAccountsForm
              country={selectedCountry}
              clearSelection={() => dispatchAndSetSelectedCountry(null)}
            />
          ) : countriesQuery.isSuccess ? (
            <SpiderCountries
              selectCountry={selectCountry}
              filteredCountries={filteredCountries}
              searchTerm={searchTerm}
              setSearchTerm={dispatchAndSetSearchTerm}
              sortKey={sortKey}
              setSortKey={dispatchAndSetSortKey}
              sortDir={sortDir}
              toggleSortDir={toggleSortDir}
            />
          ) : countriesQuery.isPending ? (
            <p className="text-center">Loading countries...</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
