/** Order a roll chain so nobody is funded by the wallet that funded them last time
 * @param {{ item: any, address: string, lastFunder: string | null }[]} links - the chain to order
 * @param {string} startAddress - who holds the funds before the chain runs
 * @returns {typeof links} - the same links, reordered
 */
export function orderRollChain(links, startAddress) {
  const pending = [...links];
  const chain = [];

  let holderAddress = startAddress;

  while (pending.length) {
    /** An unknown funder cannot be a repeat, and nobody funds themselves */
    const eligible = pending.filter(
      (link) =>
        link.lastFunder !== holderAddress && link.address !== holderAddress,
    );

    /** Picking the only fresh funder somebody else has left would strand them */
    const stranding = (link) =>
      pending.some(
        (other) => other !== link && other.lastFunder === link.address,
      );

    /** Whoever is left goes next, repeat or not, rather than stalling the chain */
    const next =
      eligible.find((link) => !stranding(link)) || eligible[0] || pending[0];

    pending.splice(pending.indexOf(next), 1);

    chain.push(next);
    holderAddress = next.address;
  }

  return chain;
}

/** Order vault accounts (or anything carrying one) by who last funded them
 * @param {any[]} items - the things to order
 * @param {(item: any) => string | null} getLastFunder - the address that last funded an item
 * @param {string} startAddress - who holds the funds before the chain runs
 * @param {(item: any) => object} [getAccount] - the vault account an item stands for
 */
export function orderByFunder(
  items,
  getLastFunder,
  startAddress,
  getAccount = (item) => item,
) {
  return orderRollChain(
    items.map((item) => ({
      item,
      address: getAccount(item).address,
      lastFunder: getLastFunder(item) || null,
    })),
    startAddress,
  ).map((link) => link.item);
}
