/** The other contract version a phrase can be connected with */
export function otherWalletVersion(version) {
  return Number(version) === 4 ? 5 : 4;
}
