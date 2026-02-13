import { execSync } from "child_process";

try {
  console.log("Running npm install to generate fresh lockfile...");
  execSync("cd /vercel/share/v0-project && npm install --prefer-offline 2>&1", {
    stdio: "inherit",
    timeout: 120000,
  });
  console.log("npm install completed successfully.");
} catch (e) {
  console.error("npm install failed:", e.message);
}
