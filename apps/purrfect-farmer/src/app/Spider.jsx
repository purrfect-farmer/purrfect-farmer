import useAppContext from "@/hooks/useAppContext";
import toast from "react-hot-toast";
import SpiderKeyInput from "@/components/SpiderKeyInput";
import SpiderBalanceDisplay from "@/components/SpiderBalanceDisplay";
import SpiderAccountsForm from "@/components/SpiderAccountsForm";
import SpiderCountries from "@/components/SpiderCountries";
import { useMemo } from "react";
import { getCountryData } from "countries-list";
import { getEmojiFlag } from "countries-list";
import { useQuery } from "@tanstack/react-query";
import Spider from "@/lib/Spider";
import useMirroredState from "@/hooks/useMirroredState";

export default function SpiderManager() {
  const { sharedSettings } = useAppContext();

  const spiderApiKey = sharedSettings.spiderApiKey;
  const [searchTerm, setSearchTerm, dispatchAndSetSearchTerm] =
    useMirroredState("spider.search-term", "");
  const [selectedCountry, setSelectedCountry, dispatchAndSetSelectedCountry] =
    useMirroredState("spider.selected-country", null);

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
    return countriesQuery.data
      ? Object.entries(countriesQuery.data.countries).reduce(
          (result, [group, list]) =>
            result.concat(
              Object.entries(list).map(([code, price]) => {
                const country = getCountryData(code);
                const emoji = getEmojiFlag(code);
                const name = country?.name || code;
                return {
                  code,
                  price: parseFloat(price),
                  emoji,
                  name,
                  group,
                };
              })
            ),
          []
        )
      : [];
  }, [countriesQuery.data]);

  /* Available Countries (Group 1) */
  const availableCountries = useMemo(() => {
    return allCountries
      .filter((item) => item.group === "1")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCountries]);

  /* Filtered Countries */
  const filteredCountries = useMemo(() => {
    return availableCountries.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCountries, searchTerm]);

  /** Select Country */
  const selectCountry = (item) => {
    if (item.price > balance) {
      toast.error("Insufficient balance for this country.");
      return;
    }
    dispatchAndSetSelectedCountry(item);
  };

  return (
    <div className="flex flex-col gap-4 grow p-4">
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
            />
          ) : countriesQuery.isPending ? (
            <p className="text-center">Loading countries...</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
