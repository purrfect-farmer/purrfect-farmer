const fs = require("fs");
const path = require("path");

const farmers = {};
const dropsDir = path.join(__dirname, "drops");

fs.readdirSync(dropsDir)
  .filter((file) => file.endsWith(".js"))
  .forEach((file) => {
    const farmerPath = path.join(dropsDir, file);
    const FarmerClass = require(farmerPath);
    farmers[FarmerClass.id] = FarmerClass;
  });

module.exports = farmers;
