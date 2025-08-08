require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.use("/auth", require("./routes/auth"));
app.use("/utils", require("./routes/utils"));
app.use("/otc", require("./routes/otc"));

const PORT = 3201;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
