/**
 * The accounts each loop is holding right now, kept in memory only.
 *
 * The assist and cultivate loops run side by side in one process, so the only
 * thing stopping both from picking the same account is an explicit claim. A
 * claim also keeps one loop from resuming an account back into farming batches
 * while the other is still driving it.
 */
const claims = new Map();

/** The claims held for a drop, created on first use */
const getDropClaims = (dropId) => {
  let dropClaims = claims.get(dropId);

  if (!dropClaims) {
    dropClaims = new Map();
    claims.set(dropId, dropClaims);
  }

  return dropClaims;
};

/** Take an account for a loop, unless another one already holds it */
export function claimAccount(dropId, userId, owner) {
  const dropClaims = getDropClaims(dropId);
  const key = String(userId);
  const holder = dropClaims.get(key);

  /** Re-claiming what this loop already holds is not a conflict */
  if (holder && holder !== owner) return false;

  dropClaims.set(key, owner);

  return true;
}

/** Hand an account back, but only the loop that took it may do so */
export function releaseAccount(dropId, userId, owner) {
  const dropClaims = claims.get(dropId);

  if (!dropClaims) return false;

  const key = String(userId);

  if (dropClaims.get(key) !== owner) return false;

  return dropClaims.delete(key);
}

/** Which loop is holding an account, if any */
export function getClaim(dropId, userId) {
  return claims.get(dropId)?.get(String(userId));
}
