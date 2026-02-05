import { setCookies } from "@/utils";
import { useEffect } from "react";

export default function useDropFarmerCookiesRestore(enabled = false, cookies) {
  useEffect(() => {
    if (enabled && cookies) {
      console.log("Cookies data:", cookies);

      const list = cookies.reduce((result, item) => {
        console.log("Cookie entry:", item);

        item.cookies.forEach((cookie) => {
          result.push({
            ...cookie,
            url: item.url,
          });
        });

        return result;
      }, []);

      console.log("Cookies list:", list);

      setCookies(list);
    }
  }, [enabled, cookies]);
}
