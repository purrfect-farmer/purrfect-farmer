/** Wallet tools every Auto drop shares, each bound to the drop's own connect and disconnect
 * @param {object} actions
 * @param {() => Promise<any>} actions.connect - prompts for a wallet and binds it
 * @param {() => Promise<any>} actions.disconnect - unbinds the account's wallet
 * @param {import("./WalletConnectPrompts.js").default} actions.prompts
 */
export default function createAutoWalletTools({
  connect,
  disconnect,
  prompts,
}) {
  return [
    {
      id: "connect-wallet",
      icon: "wallet",
      title: "Connect Wallet",
      action: () => connect(),
      dispatch: false,
    },
    {
      id: "connect-derived-wallet",
      icon: "key",
      title: "Connect Derived Wallet",
      action: () => prompts.connectDerived(),
      dispatch: false,
    },
    {
      id: "connect-auto-wallet",
      icon: "auto",
      title: "Connect Auto Wallet",
      action: () => prompts.connectFromAuto(),
      dispatch: false,
    },
    {
      id: "disconnect-wallet",
      icon: "disconnect",
      title: "Disconnect Wallet",
      action: () => disconnect(),
      dispatch: false,
    },
  ];
}
