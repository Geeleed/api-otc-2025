const constUsers = require("./users.json");

let users = [...constUsers];

const setUsers = (value) => {
  users = value;
};

const getUsers = () => users;

module.exports = { getUsers, setUsers };
