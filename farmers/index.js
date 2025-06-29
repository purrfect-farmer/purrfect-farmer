const fs = require("fs");
const path = require("path");

const farmers = {};
const dirs = [
  path.join(__dirname, "drops"),
  path.join(__dirname, "../pro/farmers/drops"),
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;

  fs.readdirSync(dir)
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const farmerPath = path.join(dir, file);
      try {
        const FarmerClass = require(farmerPath);
        if (FarmerClass?.id) {
          farmers[FarmerClass.id] = FarmerClass;
        }
      } catch (err) {
        console.warn(`Failed to load: ${farmerPath}`, err);
      }
    });
}

module.exports = farmers;
