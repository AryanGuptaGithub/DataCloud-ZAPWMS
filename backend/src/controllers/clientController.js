// backend/src/controllers/clientController.js
const Client = require("../models/Client");

// GET /clients - Only get current user's clients
exports.listClients = async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.user.id }).sort({
      created_at: -1,
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /clients - Automatically add user ID
exports.createClient = async (req, res) => {
  try {
    console.log("🔍 CREATE CLIENT REQUEST RECEIVED");
    console.log("User ID from token:", req.user?.id);
    console.log("Request body:", req.body);

    const clientData = {
      ...req.body,
      userId: req.user.id,
    };

    console.log("Client data to save:", clientData);

    const client = await Client.create(clientData);

    console.log("✅ Client created successfully:", client._id);
    res.status(201).json(client);
  } catch (error) {
    console.error("❌ Client creation error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// GET /clients/:id - Get single client (NEW - For edit/view)
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!client) {
      return res
        .status(404)
        .json({ error: "Client not found or access denied" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /clients/:id - Ensure user owns the client
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!client) {
      return res
        .status(404)
        .json({ error: "Client not found or access denied" });
    }

    // Update only allowed fields - match your model field names
    const allowedUpdates = [
      "clientName",
      "companyName",
      "clientDesignation",
      "companyAddress",
      "city",
      "phone",
      "email",
      "gstin",
      "category",
      "tags",
      "notes",
      "followUpDate",
      "followUpNotes",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    await client.save();
    res.json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /clients/:id - Ensure user owns the client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!client) {
      return res
        .status(404)
        .json({ error: "Client not found or access denied" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /clients/upcoming-followups - List upcoming followups
exports.listUpcomingFollowups = async (req, res) => {
  try {
    const days = req.query.days || 7;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));

    const upcomingFollowups = await Client.find({
      userId: req.user.id,
      followUpDate: {
        $gte: new Date(),
        $lte: targetDate,
      },
    }).sort({ followUpDate: 1 });

    res.json(upcomingFollowups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /clients/:id/communication - Add communication log
exports.addCommunicationLog = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!client) {
      return res
        .status(404)
        .json({ error: "Client not found or access denied" });
    }

    const communication = {
      type: req.body.type || "call",
      date: new Date(),
      summary: req.body.summary || "",
      notes: req.body.notes || "",
      followUpNeeded: req.body.followUpNeeded || false,
    };

    // Initialize communicationLogs array if it doesn't exist
    if (!client.communicationLogs) {
      client.communicationLogs = [];
    }

    client.communicationLogs.push(communication);
    await client.save();

    res.status(201).json(communication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /clients/import - Import multiple clients
exports.importClients = async (req, res) => {
  try {
    console.log("📥 IMPORT CLIENTS REQUEST");
    console.log("User ID:", req.user?.id);
    console.log("Import data received:", req.body);

    let clientsToImport;

    // Handle different input formats
    if (Array.isArray(req.body)) {
      clientsToImport = req.body;
    } else if (req.body.clients && Array.isArray(req.body.clients)) {
      clientsToImport = req.body.clients;
    } else if (typeof req.body === "object") {
      clientsToImport = [req.body];
    } else {
      return res.status(400).json({
        error:
          "Invalid import format. Expected array of clients or { clients: [] }",
      });
    }

    console.log(`Processing ${clientsToImport.length} clients for import`);

    // Validate and prepare clients
    const validatedClients = [];
    const errors = [];

    for (let i = 0; i < clientsToImport.length; i++) {
      try {
        const clientData = clientsToImport[i];

        // Validate required fields
        if (!clientData.clientName || !clientData.companyName) {
          errors.push({
            index: i,
            client: clientData.clientName || "Unknown",
            error:
              "Missing required fields: clientName and companyName are required",
          });
          continue;
        }

        // Prepare client data
        const clientToSave = {
          ...clientData,
          userId: req.user.id,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Ensure tags is an array
        if (clientToSave.tags) {
          if (typeof clientToSave.tags === "string") {
            clientToSave.tags = clientToSave.tags
              .split(";")
              .filter((tag) => tag.trim());
          } else if (!Array.isArray(clientToSave.tags)) {
            clientToSave.tags = [];
          }
        }

        validatedClients.push(clientToSave);
      } catch (clientError) {
        errors.push({
          index: i,
          client: clientsToImport[i]?.clientName || "Unknown",
          error: clientError.message,
        });
      }
    }

    console.log(
      `Validated ${validatedClients.length} clients, ${errors.length} errors`
    );

    if (validatedClients.length === 0) {
      return res.status(400).json({
        error: "No valid clients to import",
        details: errors,
      });
    }

    // Import clients
    const importedClients = await Client.insertMany(validatedClients, {
      ordered: false,
    });

    console.log(`✅ Successfully imported ${importedClients.length} clients`);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${importedClients.length} clients`,
      importedCount: importedClients.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      clients: importedClients,
    });
  } catch (error) {
    console.error("❌ Import error:", error.message);
    res.status(400).json({
      error: error.message,
      details: error.errors || error,
    });
  }
};

// GET /clients/export - Export clients as CSV
exports.exportClients = async (req, res) => {
  try {
    console.log("📤 Export clients request received");
    console.log("User ID:", req.user?.id);

    const clients = await Client.find({ userId: req.user.id });
    console.log(`📊 Found ${clients.length} clients to export`);

    if (clients.length === 0) {
      console.log("No clients to export");
      return res.status(404).json({ error: "No clients to export" });
    }

    // Convert to CSV format
    const headers = [
      "Client Name",
      "Company Name",
      "Designation",
      "Email",
      "Phone",
      "City",
      "Company Address",
      "GSTIN",
      "Category",
      "Tags",
      "Notes",
      "Follow-up Date",
      "Follow-up Notes",
      "Created Date",
    ].join(",");

    const csvRows = clients.map((client) =>
      [
        `"${client.clientName || ""}"`,
        `"${client.companyName || ""}"`,
        `"${client.clientDesignation || ""}"`,
        `"${client.email || ""}"`,
        `"${client.phone || ""}"`,
        `"${client.city || ""}"`,
        `"${client.companyAddress || ""}"`,
        `"${client.gstin || ""}"`,
        `"${client.category || ""}"`,
        `"${(client.tags || []).join(";")}"`,
        `"${(client.notes || "").replace(/"/g, '""')}"`,
        `"${client.followUpDate || ""}"`,
        `"${(client.followUpNotes || "").replace(/"/g, '""')}"`,
        `"${new Date(client.created_at).toISOString().split("T")[0]}"`,
      ].join(",")
    );

    const csvContent = [headers, ...csvRows].join("\n");

    console.log("📄 Generated CSV content, length:", csvContent.length);
    console.log("CSV preview:", csvContent.substring(0, 200));

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="clients_export_${Date.now()}.csv"`
    );

    res.send(csvContent);
    console.log("✅ Export completed successfully");
  } catch (error) {
    console.error("❌ Export error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
