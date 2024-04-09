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
const buildHomeworksCreateQuery = (record) => {
  let table = "Homeworks";
  let mutableFields = [
    "homeworkID",
    "homeworkStatus",
    "homeworkDescription",
    "homeworkDate",
    "homeworkContributionID",
    "homeworkName",
    "homeworkUserID",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildHomeworksReadQuery = (id, variant) => {
  let table =
    "Homeworks LEFT JOIN Users ON homeworkUserID=userID LEFT JOIN Contributions ON homeworkContributionID=contributionID";
  let fields = [
    "homeworkID",
    "homeworkStatus",
    "homeworkDescription",
    "homeworkDate",
    "homeworkContributionID",
    "homeworkName",
    "homeworkUserID",
  ];
  let sql = `SELECT ${fields} FROM ${table}`;
  if (id) sql += ` WHERE homeworkID=:ID`;
  console.log("Test fields" + fields);

  return { sql, data: { ID: id } };
};

const buildHomeworksUpdateQuery = (record, id) => {
  let table = "Homeworks";
  let mutableFields = [
    "homeworkID",
    "homeworkStatus",
    "homeworkDescription",
    "homeworkDate",
    "homeworkContributionID",
    "homeworkName",
    "homeworkUserID",
  ];
  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE homeworkID=:homeworkID`;
  return { sql, data: { ...record, homeworkID: id } };
};

const buildHomeworksDeleteQuery = (id) => {
  let table = "Homeworks";
  const sql = `DELETE FROM  ${table} 
        WHERE homeworkID=:homeworkID`;
  return { sql, data: { homeworkID: id } };
};

//Data Accessors-------------------------------------------------------

const createHomeworks = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildHomeworksReadQuery(status[0].insertId, null);

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

const updateHomeworks = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildHomeworksReadQuery(
      updateQuery.data.homeworkID,
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

const deleteHomeworks = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.homeworkID}`,
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
const getHomeworksController = async (req, res, variant) => {
  const id = req.params.id;
  try {
    if (!res || !res.status) {
      console.error("Invalid 'res' object:", res);
      return res.status(400).json({ message: "Internal Server Error" });
    }
    // with this code I aim controlling the number of data is being display in the interface.
    const page = req.query && req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = parseInt(req.query.pageSize) || 15;

    const offset = (page - 1) * pageSize;

    // Access data
    console.log(id);
    console.log("test variant" + variant);
    const query = buildHomeworksReadQuery(id, variant);
    // build ReadQuery(id, variant) + ` LIMIT ${offset}, ${pageSize}`;
    console.log("test query" + query);
    const { isSuccess, result, message: accessorMessage } = await read(query);

    if (!isSuccess) {
      console.error("Error in accessing data:", accessorMessage);
      return res.status(404).json({ message: accessorMessage });
    }

    // Response to request
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getHomeworksController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const postHomeworksController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildHomeworksCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createHomeworks(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putHomeworksController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildHomeworksUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateHomeworks(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteHomeworksController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildHomeworksDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteHomeworks(query);
  if (!isSuccess) {
    console.error("Error delting module: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("Homeworks deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------
router.get("/", (req, res) => getHomeworksController(req, res, "homeworks"));
router.get("/:id", (req, res) => getHomeworksController(req, res, null));

//router.get("/users/:id", (req, res) => getModulesController(req, res, "users"));
router.post("/", postHomeworksController);
router.put("/:id", putHomeworksController);
router.delete("/:id", deleteHomeworksController);

export default router;
