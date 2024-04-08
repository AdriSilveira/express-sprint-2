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
const buildGroupMemberCreateQuery = (record) => {
  let table = "GroupMember";
  let mutableFields = ["groupMemberID", "userID", "groupID", "grade"];
  const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);
  return { sql, data: record };
};

const buildGroupMemberReadQuery = (id, variant) => {
  let table =
    "GroupMember LEFT JOIN Users ON GroupMember.userID = Users.userID LEFT JOIN Groups ON Groups.GroupID = GroupMember.groupID";
  let fields = [
    "groupMemberID",
    "groupMember.userID",
    "groupMember.groupID",
    "grade",
  ];

  let sql = `SELECT ${fields} FROM ${table}`;
  if (id) sql += ` WHERE groupMemberID=:ID`;

  return { sql, data: { ID: id } };
};

const buildGroupMemberUpdateQuery = (record, id) => {
  let table = "GroupMember";
  let mutableFields = ["groupID", "grade"];

  const sql =
    `UPDATE ${table} ` +
    buildSetFields(mutableFields) +
    ` WHERE groupMemberID=:groupMemberID`;
  return { sql, data: { ...record, groupMemberID: id } };
};

const buildModulesDeleteQuery = (id) => {
  let table = "GroupMember";
  const sql = `DELETE FROM  ${table} 
        WHERE groupMemberID=:groupMemberID`;
  return { sql, data: { groupMemberID: id } };
};

//Data Accessors-------------------------------------------------------

const createGroupMember = async (createQuery) => {
  try {
    const status = await database.query(createQuery.sql, createQuery.data);

    const readQuery = buildGroupMemberReadQuery(status[0].insertId, null);

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

const updateGroupMember = async (updateQuery) => {
  try {
    const status = await database.query(updateQuery.sql, updateQuery.data);

    if (status[0].affectedRows === 0) {
      return {
        isSuccess: false,
        result: null,
        message: "Failed to update record: no rows affected",
      };
    }
    const readQuery = buildGroupMemberReadQuery(
      updateQuery.data.groupMemberID,
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

const deleteGroupMember = async (deleteQuery) => {
  try {
    const status = await database.query(deleteQuery.sql, deleteQuery.data);

    return status[0].affectedRows === 0
      ? {
          isSuccess: false,
          result: null,
          message: `Failed to delete record: ${deleteQuery.data.groupMemberID}`,
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
const getGroupMemberController = async (req, res, variant) => {
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
    // console.log(id);
    // console.log("test variant" + variant);
    const query = buildGroupMemberReadQuery(id, variant);
    // buildModulesReadQuery(id, variant) + ` LIMIT ${offset}, ${pageSize}`;
    console.log("test query" + query);
    const { isSuccess, result, message: accessorMessage } = await read(query);

    if (!isSuccess) {
      console.error("Error in accessing data:", accessorMessage);
      return res.status(404).json({ message: accessorMessage });
    }

    // Response to request
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getGroupMemberController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const postGroupMemberController = async (req, res) => {
  const record = req.body;
  // Validate request

  // Access data
  const query = buildGroupMemberCreateQuery(record);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await createGroupMember(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(201).json(result);
};
const putGroupMemberController = async (req, res) => {
  const id = req.params.id;
  const record = req.body;
  // Validate request
  // Access data
  const query = buildGroupMemberUpdateQuery(record, id);
  console.log(sql);
  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await updateGroupMember(query);
  if (!isSuccess) return res.status(400).json({ message: accessorMessage });

  // Response to request
  res.status(200).json(result);
};
const deleteGroupMemberController = async (req, res) => {
  const id = req.params.id;
  // Validate request

  // Access data
  const query = buildGroupMemberDeleteQuery(id);
  console.log("SQL for delete operation:", sql);

  const {
    isSuccess,
    result,
    message: accessorMessage,
  } = await deleteGroupMember(query);
  if (!isSuccess) {
    console.error("Error delting module: ", accessorMessage);
    return res.status(400).json({ message: accessorMessage });
  }

  // Response to request
  console.log("GroupMember deleted successfully");
  res.status(200).json({ message: accessorMessage });
};

//Endpoints-------------------------------------------------------
router.get("/", (req, res) =>
  getGroupMemberController(req, res, "groupMember")
);
router.get("/:id", (req, res) => getGroupMemberController(req, res, null));

router.get("/users/:id", (req, res) =>
  getGroupMemberController(req, res, "users")
);
router.post("/", postGroupMemberController);
router.put("/:id", putGroupMemberController);
router.delete("/:id", deleteGroupMemberController);

export default router;
