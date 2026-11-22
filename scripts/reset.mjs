// Deletes the demo database and uploaded files. The next request re-seeds.
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
rmSync("storage/db.json", { force: true });
rmSync("storage/uploads", { recursive: true, force: true });
mkdirSync("storage/uploads", { recursive: true });
writeFileSync("storage/uploads/.gitkeep", "");
console.log("Demo data cleared. Start the app and it will re-seed Session 1 and the five profiles.");
