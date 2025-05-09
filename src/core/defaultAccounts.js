import { uuid } from "@/lib/utils";

/** Default Settings */
const defaultAccounts = [
  {
    id: uuid(), // Fixed UUID
    title: "Account 1",
    telegramInitData: null,
  },
];

export default defaultAccounts;
