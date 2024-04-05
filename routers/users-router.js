import { Router } from "express";
import database from "../database.js";

const router = Router();

//Query Builders-------------------------------------------------------
const buildSetFields = (fields) =>
  fields.reduce(
    (setSQL, field, index) =>
      setSQL + `${field}=:${field}` + (index === fields.length - 1 ? "" : ", "),
    "SET "
  );
const buildUsersReadQuery = (id, variant) => {
  let table = "Users";
  let fields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userTypeID",
    "userImageURL",
    // Specify the table alias for userTypeID
    //"CONCAT()",
    //"CONCAT(userFirstName, ' ', userLastName) AS userName",
  ];
  let fields2 = [
    "Users.userID",
    "Users.userFirstName",
    "Users.userLastName",
    "Users.userEmail",
    "Users.userLevel",
    "Users.userYearID",
    "Users.userTypeID",
    "Users.userImageURL",
  ];
  let sql = "";

  const Student = 1; // Primary key for student type in my database
  const Staff = 2; // Primary key for staff
  const Lecturer = 3; // Primary key for lecturer type in my database
  const Professor = 4;
  const Academic_Mentor = 6;
  const Module_Leader = 7;
  //const Admin = 5; DELETED
  switch (variant) {
    case "student":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Student}`;
      break;
    case "staff":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Staff}`;
      break;
    case "lecturer":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Lecturer}`;
      break;
    case "professor":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Professor}`;
      break;
    case "mentor":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Academic_Mentor}`;
      break;
    case "leader":
      sql = `SELECT ${fields} FROM ${table} WHERE Users.userTypeID=${Module_Leader}`;
      break;
    case "groups":
      console.log("does this reatch");
      sql = `SELECT ${fields2}
                  FROM Users 
                  INNER JOIN	GroupMember ON Users.userID = GroupMember.userID
                  WHERE GroupMember.groupID =:ID`;
      break;
    default:
      sql = `SELECT ${fields} FROM ${table}`;
      if (id) sql += ` WHERE userID=:ID`;
  }
  return { sql, data: { ID: id } };
};
const buildUsersCreateQuery = (record) => {
  let table = "Users";
  let mutableFields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userTypeID",
    "userImageURL",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};
const buildUsersUpdateQuery = (record, id) => {
  let table = "Users";
  let mutableFields = [
    "userID",
    "userFirstName",
    "userLastName",
    "userEmail",
    "userLevel",
    "userYearID",
    "userTypeID",
    "userImageURL",
  ];

  const sql =
    // "UPDATE Users "
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE userID=:userID`;
  return { sql, data: { ...record, userID: id } };
};
const buildUsersDeleteQuery = (id) => {
  let table = "Users";
  const sql = `DELETE FROM  ${table} 
          WHERE userID=:userID`;
  return { sql, data: { userID: id } };
};

//Data Accessors-------------------------------------------------------
const read = async (query) => {
  try {
    const [result] = await database.query(query.sql, query.data);
    return result.length === 0
      ? { isSuccess: false, result: null, message: "No record(s) found" }
      : {
          isSuccess: true,
          result: result,
          message: "Record(s) successfully recovered",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};
const createUsers = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildUsersReadQuery(status[0].insertId, null);

    const { isSuccess, result, message } = await read(readQuery);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
        }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover the inserted record: ${message}`,
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};
const UpdateUsers = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }

    const readQuery = buildUsersReadQuery(
      updateQuery.sql,
      updateQuery.data,
      null
    );

    const { isSuccess, result, message } = await read(readQuery);

    return isSuccess
      ? {
          isSuccess: true,
          result: result,
          message: "Record successfully recovered",
        }
      : {
          isSuccess: false,
          result: null,
          message: `Failed to recover the inserted record: ${message}`,
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};
const deleteUsers = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.userID}`,
        }
      : {
          isSuccess: true,
          result: null,
          message: "Record successfully deleted",
        };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      message: `Failed to execute query: ${error.message}`,
    };
  }
};

//Controllers-------------------------------------------------------

const getUsersController = async (req, res, variant) => {
  const id = req.params.id;

  // Validate request
  console.log("This is test" + id, variant);
  // Access data
  const query = buildUsersReadQuery(id, variant);
  const { isSuccess, result, message: accessorMessage } = await read(query);
  if (!isSuccess) return res.status(404).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const postUsersController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildUsersCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createUsers(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putUsersController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildUsersUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await UpdateUsers(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteUsersController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildUsersDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteUsers(query);
  if (!isSuccess) {
    console.error("Error deleting user: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("User deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------
router.get("/", (req, res) => getUsersController(req, res, null));
router.get("/staff", (req, res) => getUsersController(req, res, "leaders"));
router.get("/:id(\\d+)", (req, res) => getUsersController(req, res, null));
router.get("/groups/:id", (req, res) => getUsersController(req, res, "groups"));
router.post("/", postUsersController);
router.put("/:id", putUsersController);
router.delete("/:id", deleteUsersController);

export default router;
