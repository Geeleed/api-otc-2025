require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getUsers } = require("./constants/users");

const app = express();

const allowedOrigins = [
  "http://localhost:3200",
  "http://localhost:3201",
  "https://otc.geeleed.com",
  "https://api-otc.geeleed.com",
];

const corsConfig = {
  credentials: true,
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg =
        "The CORS policy for this site does not " +
        "allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
};

app.use(cors(corsConfig));

app.route("/").get(async (req, res) => {
  res.redirect(process.env.FRONTEND_URL);
});

app.use("/auth", require("./routes/auth"));
app.use("/utils", require("./routes/utils"));
app.use("/otc", require("./routes/otc"));

const PORT = 3201;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
