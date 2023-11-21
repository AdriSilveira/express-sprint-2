//Imports-----------------------------------------------------
import mysql from "mysql2/promise";

//Database Connection-----------------------------------------
const dbConfig = {
  database: process.env.DB_NAME || "fyproject",
  port: process.env.DB_PORT || 3306,
  host: process.env.DB_HOST || "localhost",
  user: "root",
  // password: "",
  // user: process.env.USER || "root",
  password: process.env.DB_PSWD || "",
  namedPlaceholders: true,
};
let database;
(async () => {
  try {
    database = await mysql.createConnection(dbConfig);
    console.log("Database connection established successfully");
  } catch (error) {
    console.log("Error creating database connection: " + error.message);
  }
})();
export default database;
