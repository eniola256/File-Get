import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const port = Number.parseInt(process.env.PORT || "3000", 10);

await connectDB();

app.listen(port, () => {
  console.log(`FileGet API listening on http://localhost:${port}`);
});
