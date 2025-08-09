const pool = require("../configs/db");
const constUsers = require("./users.json");

let users = [...constUsers];

const setUsers = async (value) => {
  const { email, password } = value;
  try {
    const result = await pool.query(
      "UPDATE otc_users SET password = $1 WHERE email = $2",
      [password, email]
    );
    return result.rows;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getUsers = async () => {
  try {
    const result = await pool.query("SELECT * FROM otc_users");
    return result.rows;
  } catch (error) {
    console.error(error);
    return [];
  }
};

module.exports = { getUsers, setUsers };
