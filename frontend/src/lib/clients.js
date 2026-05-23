// frontend/src/lib/clients.js
import api from "./axios";

export const listClients = async (params = {}) => {
  const response = await api.get("/clients", { params });
  return response.data;
};

export const createClient = async (clientData) => {
  const response = await api.post("/clients", clientData);
  return response.data;
};

export const updateClient = async (id, clientData) => {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};

export const listUpcomingFollowups = async (days = 7) => {
  const response = await api.get("/clients/upcoming-followups", {
    params: { days },
  });
  return response.data;
};

export const addCommunicationLog = async (clientId, logData) => {
  const response = await api.post(
    `/clients/${clientId}/communication`,
    logData
  );
  return response.data;
};

// frontend/src/lib/clients.js
export const importClientsCSV = async (clientsData) => {
  console.log("📤 Sending import request with", clientsData.length, "clients");

  const response = await api.post("/clients/import", {
    clients: clientsData,
  });

  console.log("✅ Import response:", response.data);
  return response.data;
};
export const exportClientsToCSV = async () => {
  console.log("📤 Calling export API endpoint");
  try {
    const response = await api.get("/clients/export");
    console.log("✅ Export API response:", {
      status: response.status,
      headers: response.headers,
      dataLength: response.data?.length,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Export API error:", {
      message: error.message,
      response: error.response,
      config: error.config,
    });
    throw error;
  }
};

// Helper function to parse CSV
const parseCSVToJSON = (csvData) => {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const client = {};
      headers.forEach((header, index) => {
        if (header && values[index] !== undefined) {
          const value = values[index];

          // DIRECT FIELD MAPPING based on your CSV structure
          if (header === "followUpDate") {
            // This contains notes, move to followUpNotes
            clientData["followUpNotes"] = value;
          } else if (header === "followUpNotes") {
            // This contains dates, move to followUpDate
            clientData["followUpDate"] = value;
          } else if (header === "gstin") {
            // This contains city/district names, ignore it
            // We'll get city from the city column
            clientData["gstin"] = ""; // Leave empty since CSV doesn't have GST numbers
          } else if (header === "category") {
            // Handle category properly
            const lowerValue = value.toLowerCase();
            if (
              ["premium", "regular", "lead", "inactive", "prospect"].includes(
                lowerValue
              )
            ) {
              clientData["category"] = lowerValue;
            } else {
              clientData["category"] = "regular";
            }
          } else {
            // All other fields map directly
            clientData[header] = value;
          }
        }
      });
      return client;
    })
    .filter((client) => client.clientName);
};

// Add to your frontend/src/lib/clients.js
export const importClientsFromCSV = async (clientsData) => {
  console.log("📤 Sending import request for", clientsData.length, "clients");

  try {
    // Import clients one by one to handle errors individually
    const results = [];
    const errors = [];

    for (let i = 0; i < clientsData.length; i++) {
      try {
        const clientData = clientsData[i];
        const response = await api.post("/clients", clientData);
        results.push({
          index: i,
          success: true,
          client: response.data,
        });
      } catch (error) {
        errors.push({
          index: i,
          success: false,
          error: error.response?.data?.error || error.message,
          data: clientsData[i],
        });
      }
    }

    return {
      total: clientsData.length,
      success: results.length,
      errors: errors.length,
      results,
      errors,
    };
  } catch (error) {
    console.error("Import error:", error);
    throw error;
  }
};
