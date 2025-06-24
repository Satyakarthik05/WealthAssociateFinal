const CallExecutive = require("../Models/CallExecutiveModel");
const Agent = require("../Models/AgentModel");
const jwt = require("jsonwebtoken");
secret = "Wealth@123";
const mongoose = require("mongoose");

const addCallExecutive = async (req, res) => {
  try {
    const { name, phone, location, password, assignedType } = req.body;

    // Validate input
    if (!name || !phone || !location || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if phone number already exists
    const existingExecutive = await CallExecutive.findOne({ phone });
    if (existingExecutive) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }

    // Create and save the new executive
    const newExecutive = new CallExecutive({
      name,
      phone,
      location,
      password,
      assignedType,
    });
    await newExecutive.save();

    res.status(201).json({ message: "Call executive added successfully" });
  } catch (error) {
    console.error("Error adding call executive:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const CallExecutiveLogin = async (req, res) => {
  const { MobileNumber, Password } = req.body;

  try {
    const Agents = await CallExecutive.findOne({
      phone: MobileNumber,

      password: Password,
    });
    if (!Agents) {
      return res
        .status(400)
        .json({ message: "Invalid MobileNumber or Password" });
    }

    const token = await jwt.sign({ AgentId: Agents._id }, secret, {
      expiresIn: "30d",
    });

    res.status(200).json({ message: "Login Successful", token });
  } catch (error) {
    console.log(error);
  }
};

const getCallExecutives = async (req, res) => {
  try {
    const executives = await CallExecutive.find();
    res.status(200).json(executives);
  } catch (error) {
    console.error("Error fetching call executives:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCallExe = async (req, res) => {
  try {
    const agentDetails = await CallExecutive.findById(req.AgentId);
    if (!agentDetails) {
      return res.status(200).json({ message: "Agent not found" });
    } else {
      res.status(200).json(agentDetails);
    }
  } catch (error) {
    console.log(error);
  }
};

const editExecutive = async (req, res) => {
  const { id } = req.params;
  const { name, phone, location, password, assignedType } = req.body;

  try {
    const updateData = { name, phone, location, assignedType,password };
   

    const updatedExecutive = await CallExecutive.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedExecutive) {
      return res.status(404).json({ message: "Executive not found" });
    }

    res.status(200).json({ message: "Executive updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating executive", error });
  }
};



// Delete call executive
const deleteCallExecutive = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedExecutive = await CallExecutive.findByIdAndDelete(id);

    if (!deletedExecutive) {
      return res.status(404).json({
        success: false,
        message: "Call executive not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Call executive deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting call executive:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};




const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const executive = await CallExecutive.findById(id);
    
    if (!executive) {
      return res.status(404).json({ message: "Call executive not found" });
    }

    executive.status = executive.status === "active" ? "inactive" : "active";
    await executive.save();

    res.status(200).json({
      message: "Status updated successfully",
      status: executive.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get status controller
const getStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const executive = await CallExecutive.findById(id).select("status");
    
    if (!executive) {
      return res.status(404).json({ message: "Call executive not found" });
    }

    res.status(200).json({
      status: executive.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const myagents = async (req, res) => {
  try {
    // 1. Validate and convert AgentId
    if (!mongoose.Types.ObjectId.isValid(req.AgentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agent ID format",
        receivedId: req.AgentId,
      });
    }

    const executiveId = new mongoose.Types.ObjectId(req.AgentId);

    // 2. Clean up invalid assignments first
    const cleanupResult = await CallExecutive.updateOne(
      { _id: executiveId },
      { $pull: { assignedUsers: { userId: null } } }
    );
    // console.log(`Cleaned ${cleanupResult.modifiedCount} invalid assignments`);

    // 3. Get executive with valid agents
    const executive = await CallExecutive.aggregate([
      { $match: { _id: executiveId } },
      { $unwind: "$assignedUsers" },
      {
        $match: {
          "assignedUsers.userType": "Agent_Wealth_Associate",
          "assignedUsers.userId": { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "agent_wealth_associates",
          localField: "assignedUsers.userId",
          foreignField: "_id",
          as: "agentDetails",
        },
      },
      { $unwind: "$agentDetails" },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          phone: { $first: "$phone" },
          agents: {
            $push: {
              agent: "$agentDetails",
              assignmentId: "$assignedUsers._id",
              assignedAt: "$assignedUsers.assignedAt",
            },
          },
        },
      },
    ]);

    if (!executive || executive.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid agent assignments found",
      });
    }

    // 4. Format the response
    const result = executive[0];
    const assignedAgents = result.agents.map((item) => ({
      ...item.agent,
      assignmentId: item.assignmentId,
      assignedAt: item.assignedAt,
    }));

    res.json({
      success: true,
      data: assignedAgents,
      executiveInfo: {
        name: result.name,
        phone: result.phone,
      },
    });
  } catch (error) {
    console.error("Error in myagents:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};


const myCustomers = async (req, res) => {
  try {
    // 1. Validate and convert AgentId
    if (!mongoose.Types.ObjectId.isValid(req.AgentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agent ID format",
        receivedId: req.AgentId,
      });
    }

    const executiveId = new mongoose.Types.ObjectId(req.AgentId);

    // 2. Get executive with valid customers and populate all necessary fields
    const executive = await CallExecutive.aggregate([
      { $match: { _id: executiveId } },
      { $unwind: "$assignedUsers" },
      {
        $match: {
          "assignedUsers.userType": "Customers",
          "assignedUsers.userId": { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "assignedUsers.userId",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      { $unwind: "$customerDetails" },
      {
        $project: {
          _id: 0,
          customer: {
            $mergeObjects: [
              "$customerDetails",
              {
                assignmentId: "$assignedUsers._id",
                assignedAt: "$assignedUsers.assignedAt",
              },
            ],
          },
          executiveInfo: {
            name: "$name",
            phone: "$phone",
          },
        },
      },
      {
        $group: {
          _id: null,
          customers: { $push: "$customer" },
          executiveInfo: { $first: "$executiveInfo" },
        },
      },
    ]);

    if (!executive || executive.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid customer assignments found",
      });
    }

    // 3. Format the response with all customer details
    const result = executive[0];
    
    res.json({
      success: true,
      data: result.customers,
      executiveInfo: result.executiveInfo,
    });
  } catch (error) {
    console.error("Error in myCustomers:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



const myProperties = async (req, res) => {
  try {
    console.log('1. Starting myProperties with AgentId:', req.AgentId);

    // 1. Validate and convert AgentId
    if (!mongoose.Types.ObjectId.isValid(req.AgentId)) {
      console.log('2. Invalid AgentId format:', req.AgentId);
      return res.status(400).json({
        success: false,
        message: "Invalid Agent ID format",
        receivedId: req.AgentId,
      });
    }

    const executiveId = new mongoose.Types.ObjectId(req.AgentId);
    console.log('3. Converted executiveId:', executiveId);

    // Debug: Check the raw executive document
    const executiveDoc = await CallExecutive.findById(executiveId).lean();
    console.log('4. Raw executive document:', JSON.stringify(executiveDoc, null, 2));
    
    if (!executiveDoc) {
      console.log('5. No executive document found');
      return res.status(404).json({
        success: false,
        message: "Executive not found"
      });
    }

    console.log('6. Assignments found:', executiveDoc.assignedUsers?.length || 0);
    console.log('7. Sample assignment:', executiveDoc.assignedUsers?.[0]);

    // 2. Aggregation pipeline
    console.log('8. Starting aggregation pipeline');
    const pipeline = [
      { $match: { _id: executiveId } },
      { $unwind: "$assignedUsers" },
      {
        $match: {
          "assignedUsers.userType": "Property",
          "assignedUsers.userId": { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          "convertedUserId": {
            $cond: {
              if: { $eq: [{ $type: "$assignedUsers.userId" }, "string"] },
              then: { $toObjectId: "$assignedUsers.userId" },
              else: "$assignedUsers.userId"
            }
          }
        }
      },
      {
        $lookup: {
          from: "properties",
          localField: "convertedUserId",
          foreignField: "_id",
          as: "propertyDetails"
        }
      },
      { $unwind: { path: "$propertyDetails", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          property: {
            $mergeObjects: [
              "$propertyDetails",
              {
                assignmentId: "$assignedUsers._id",
                assignedAt: "$assignedUsers.assignedAt"
              }
            ]
          },
          executiveInfo: {
            name: "$name",
            phone: "$phone"
          }
        }
      },
      {
        $group: {
          _id: null,
          properties: { $push: "$property" },
          executiveInfo: { $first: "$executiveInfo" }
        }
      }
    ];

    console.log('9. Full aggregation pipeline:', JSON.stringify(pipeline, null, 2));
    
    const result = await CallExecutive.aggregate(pipeline);
    console.log('10. Aggregation result:', JSON.stringify(result, null, 2));

    // 3. Handle results
    if (!result.length || !result[0].properties.length) {
      console.log('11. No valid properties found in result');
      
      // Additional debug: Check if properties exist for the userIds
      const assignedUserIds = executiveDoc.assignedUsers
        ?.filter(a => a.userType === "Property" && a.userId)
        ?.map(a => a.userId) || [];
      
      console.log('12. Assigned userIds:', assignedUserIds);
      
      if (assignedUserIds.length > 0) {
        const properties = await mongoose.connection.db.collection("properties")
          .find({ _id: { $in: assignedUserIds } })
          .toArray();
        console.log('13. Properties found for these IDs:', properties.length);
      }
      
      return res.status(404).json({
        success: false,
        message: "No valid property assignments found",
        debug: {
          executiveId: req.AgentId,
          assignmentsCount: executiveDoc.assignedUsers?.length || 0,
          propertyAssignments: executiveDoc.assignedUsers?.filter(a => a.userType === "Property") || []
        }
      });
    }

    // 4. Successful response
    console.log('14. Successfully found properties:', result[0].properties.length);
    res.json({
      success: true,
      data: result[0].properties,
      executiveInfo: result[0].executiveInfo
    });

  } catch (error) {
    console.error('15. Error in myProperties:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
module.exports = {
  addCallExecutive,
  getCallExecutives,
  deleteCallExecutive,
  CallExecutiveLogin,
  myagents,
  myCustomers,
  myProperties,
  getCallExe,
  editExecutive,
  toggleStatus,
  getStatus
};
