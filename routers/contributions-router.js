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

const buildContributionsReadQuery = (id, variant) => {
  let table = "Contributions";
  let fields = [
    "contributionID",
    "contributionName",
    "contributionFutureTasks",
    "submissionDate",
    "groupID",
  ];
  // let sql = "";
  let sql = `SELECT ${fields} FROM ${table}`;
  if (id) sql += ` WHERE contributionID=:ID`;

  //console.log("Testing SQL" + sql);

  return { sql, data: { ID: id } };
};
const buildContributionsCreateQuery = (record) => {
  let table = "Contributions";
  let mutableFields = [
    "contributionID",
    "contributionName",
    "contributionFutureTasks",
    "submissionDate",
    "groupID",
  ];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildContributionsUpdateQuery = (record, id) => {
  let table = "Contributions";
  let mutableFields = [
    "contributionID",
    "contributionName",
    "contributionFutureTasks",
    "submissionDate",
    "groupID",
  ];
  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE contributionID=:contributionID`;
  return { sql, data: { ...record, contributionID: id } };
};

const buildContributionsDeleteQuery = (id) => {
  let table = "Contributions";
  const sql = `DELETE FROM  ${table} 
        WHERE contributionID=:contributionID`;
  return { sql, data: { contributionID: id } };
};

//Data Accessors-------------------------------------------------------

const createContributions = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildContributionsReadQuery(status[0].insertId, null);

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

const updateContributions = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildContributionsReadQuery(
      updateQuery.data.contributionID,
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

const deleteContributions = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.contributionID}`,
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
const getContributionsController = async (req, res, variant) => {
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
    const query = buildContributionsReadQuery(id, variant);
    // build ReadQuery(id, variant) + ` LIMIT ${offset}, ${pageSize}`;
    console.log("test query" + query.sql);
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
const postContributionsController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildContributionsCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createContributions(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putContributionsController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildContributionsUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateContributions(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteContributionsController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildContributionsDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteContributions(query);
  if (!isSuccess) {
    console.error("Error delting module: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("Contribution deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------
router.get("/", (req, res) =>
  getContributionsController(req, res, "contributions")
);
router.get("/:id", (req, res) => getContributionsController(req, res, null));

//router.get("/users/:id", (req, res) => getModulesController(req, res, "users"));
router.post("/", postContributionsController);
router.put("/:id", putContributionsController);
router.delete("/:id", deleteContributionsController);

export default router;
