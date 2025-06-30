/**
 * Get package.json
 */
export function getPackageJson() {
  return {
    name: process.env["npm_package_name"],
    version: process.env["npm_package_version"],
  };
}
