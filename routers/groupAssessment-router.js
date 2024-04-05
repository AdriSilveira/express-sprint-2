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

const buildGroupAssessmentReadQuery = (id, variant) => {
  let table = "GroupAssessment";
  let fields = ["groupAssessmentID", "assessmentID", "groupID"];
  // let sql = "";
  let sql = `SELECT ${fields} FROM ${table}`;
  if (id) sql += ` WHERE groupAssessmentID=:ID`;

  //console.log("Testing SQL" + sql);

  return { sql, data: { ID: id } };
};
const buildGroupAssessmentCreateQuery = (record) => {
  let table = "GroupAssessment";
  let mutableFields = ["groupAssessmentID", "assessmentID", "groupID"];

  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildGroupAssessmentUpdateQuery = (record, id) => {
  let table = "GroupAssessment";
  let mutableFields = ["groupAssessmentID", "assessmentID", "groupID"];
  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE groupAssessmentID=:groupAssessmentID`;
  return { sql, data: { ...record, groupAssessmentID: id } };
};

const buildGroupAssessmentDeleteQuery = (id) => {
  let table = "GroupsAssessment";
  const sql = `DELETE FROM  ${table} 
        WHERE groupAssessmentID=:groupAssessmentID`;
  return { sql, data: { groupAssessmentID: id } };
};

//Data Accessors-------------------------------------------------------

const createGroupAssessment = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildGroupAssessmentReadQuery(status[0].insertId, null);

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

const updateGroupAssessment = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildGroupAssessmentReadQuery(
      updateQuery.data.groupAssessmentID,
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

const deleteGroupAssessment = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.groupAssessmentID}`,
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
const getGroupAssessmentController = async (req, res, variant) => {
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
    const query = buildGroupAssessmentReadQuery(id, variant);
    // build ReadQuery(id, variant) + ` LIMIT ${offset}, ${pageSize}`;

    const { isSuccess, result, message: accessorMessage } = await read(query);

    if (!isSuccess) {
      console.error("Error in accessing data:", accessorMessage);
      return res.status(404).json({ message: accessorMessage });
    }

    // Response to request
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getGroupAssessmentController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const postGroupAssessmentController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildGroupAssessmentCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createGroupAssessment(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putGroupAssessmentController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildGroupAssessmentUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateGroupAssessment(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteGroupAssessmentController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildGroupAssessmentDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteGroupAssessment(query);
  if (!isSuccess) {
    console.error("Error delting module: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("GroupAssessment deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------
router.get("/", (req, res) =>
  getGroupAssessmentController(req, res, "groupAssessment")
);
router.get("/:id", (req, res) => getGroupAssessmentController(req, res, null));

router.post("/", postGroupAssessmentController);
router.put("/:id", putGroupAssessmentController);
router.delete("/:id", deleteGroupAssessmentController);

export default router;
