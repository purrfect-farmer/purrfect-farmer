/**
 * Copy the methods, getters and setters of each trait class onto `Target`.
 *
 * A trait is a class with no parent that only groups methods. The traits are
 * applied flat, so their order does not matter. A name defined by two traits,
 * or by a trait and `Target` itself, throws instead of silently winning.
 * Overriding an inherited method is allowed.
 *
 * Copied methods keep their trait as their `super` home, so a trait calls an
 * inherited method explicitly, e.g. `Base.prototype.name.call(this)`.
 *
 * @param {Function} Target
 * @param {Function[]} traits
 * @returns {Function} `Target`
 */
export default function applyTraits(Target, traits) {
  const sources = new Map();

  for (const Trait of traits) {
    const descriptors = Object.getOwnPropertyDescriptors(Trait.prototype);

    for (const [name, descriptor] of Object.entries(descriptors)) {
      if (name === "constructor") continue;

      if (sources.has(name)) {
        throw new Error(
          `${Target.name}: ${name} is defined by both ${sources.get(name)} and ${Trait.name}`,
        );
      }

      if (Object.hasOwn(Target.prototype, name)) {
        throw new Error(
          `${Target.name}: ${name} from ${Trait.name} clashes with its own member`,
        );
      }

      sources.set(name, Trait.name);
      Object.defineProperty(Target.prototype, name, descriptor);
    }
  }

  return Target;
}
