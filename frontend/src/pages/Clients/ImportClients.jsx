// src/pages/Customers/ImportClients.jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLoading } from "@/components/LoadingProvider";
import { createClient } from "@/lib/clients";
import {
  Upload,
  Download,
  FileText,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ChevronRight,
  Info,
} from "lucide-react";

export default function ImportClients() {
  const navigate = useNavigate();
  const { withLoader } = useLoading();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("upload");
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState("idle"); // idle, parsing, uploading, complete
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({
    total: 0,
    success: 0,
    errors: 0,
    errorDetails: [],
  });
  const [previewData, setPreviewData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setImportFile(file);
    setImportStatus("parsing");
    setPreviewData([]);
    setImportResults({
      total: 0,
      success: 0,
      errors: 0,
      errorDetails: [],
    });

    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target.result;
        const rows = csvData.split("\n").filter((row) => row.trim());

        if (rows.length < 2) {
          throw new Error("CSV file is empty or has only headers");
        }

        // Parse headers
        const headers = rows[0].split(",").map((h) => h.trim());
        setCsvHeaders(headers);

        // Parse preview rows (first 5 rows)
        const previewRows = [];
        for (let i = 1; i < Math.min(6, rows.length); i++) {
          const values = rows[i]
            .split(",")
            .map((v) => v.trim().replace(/^"|"$/g, ""));
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || "";
          });
          previewRows.push(rowData);
        }

        setPreviewData(previewRows);
        setImportResults((prev) => ({ ...prev, total: rows.length - 1 }));
        setImportStatus("idle");
        setActiveTab("preview");
      } catch (error) {
        console.error("CSV parsing error:", error);
        toast.error(`Failed to parse CSV: ${error.message}`);
        setImportStatus("idle");
        setImportFile(null);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      setImportStatus("idle");
    };

    reader.readAsText(file);
  };

  // Start import process
  const handleStartImport = async () => {
    if (!importFile) return;

    try {
      setImportStatus("uploading");
      setImportProgress(0);

      await withLoader(async () => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          const csvData = e.target.result;
          const rows = csvData.split("\n").filter((row) => row.trim());
          const headers = rows[0].split(",").map((h) => h.trim());

          console.log("=== CSV IMPORT DEBUG ===");
          console.log("Headers:", headers);
          console.log("Number of headers:", headers.length);

          // Log first few rows with column mapping
          for (let i = 1; i < Math.min(3, rows.length); i++) {
            const values = rows[i]
              .split(",")
              .map((v) => v.trim().replace(/^"|"$/g, ""));
            console.log(`\nRow ${i}:`);
            console.log("Number of values:", values.length);
            console.log("Values:", values);

            // Show header-value mapping
            headers.forEach((header, idx) => {
              console.log(`  ${idx}. "${header}" = "${values[idx] || ""}"`);
            });
          }
          console.log("=== END DEBUG ===");

          const successRows = [];
          const errorRows = [];

          // Process each row
          for (let i = 1; i < rows.length; i++) {
            try {
              const row = rows[i];
              if (!row.trim()) continue;

              const values = row
                .split(",")
                .map((v) => v.trim().replace(/^"|"$/g, ""));

              // Create client object with fixed column mapping
              const clientData = {
                clientName: values[0] || "",
                companyName: values[1] || "",
                clientDesignation: values[2] || "",
                email: values[3] || "",
                phone: values[4] || "",
                city: values[5] || "",
                companyAddress: values[6] || "",
                category: values[7] || "regular",
                gstin: values[8] || "lead",
                tags: values[9] ? [values[9]] : [],
                notes: values[10] || "",
                // FIX: followUpDate should be a date, not text description
                followUpDate:
                  values[11] && /^\d{4}-\d{2}-\d{2}$/.test(values[11])
                    ? values[11]
                    : null, // Set to null if not a valid date
                followUpNotes: values[12] || "",
              };

              console.log(`Row ${i + 1} processed:`, clientData);

              // Validate required fields
              if (!clientData.clientName || !clientData.companyName) {
                throw new Error(
                  "Missing required fields: clientName and companyName"
                );
              }

              // Fix category validation
              const validCategories = [
                "premium",
                "regular",
                "lead",
                "inactive",
                "prospect",
              ];
              if (
                clientData.category &&
                !validCategories.includes(clientData.category.toLowerCase())
              ) {
                console.warn(
                  `Invalid category "${clientData.category}", defaulting to "regular"`
                );
                clientData.category = "regular";
              }

              // Fix GSTIN validation
              const validGstin = ["lead", "regular", "premium", "prospect"];
              if (
                clientData.gstin &&
                !validGstin.includes(clientData.gstin.toLowerCase())
              ) {
                console.warn(
                  `Invalid GSTIN status "${clientData.gstin}", defaulting to "lead"`
                );
                clientData.gstin = "lead";
              }

              // Fix tags format
              if (clientData.tags && typeof clientData.tags === "string") {
                clientData.tags = clientData.tags
                  .split(";")
                  .filter((tag) => tag.trim());
              }

              // IMPORTANT: Check what's in followUpDate field
              if (
                clientData.followUpDate &&
                !/^\d{4}-\d{2}-\d{2}$/.test(clientData.followUpDate)
              ) {
                console.log(
                  `Row ${i + 1}: followUpDate is not a valid date: "${
                    clientData.followUpDate
                  }"`
                );
                console.log(`Moving this text to followUpNotes instead`);

                // If followUpDate contains text, move it to followUpNotes
                if (clientData.followUpDate) {
                  const existingNotes = clientData.followUpNotes
                    ? clientData.followUpNotes + " "
                    : "";
                  clientData.followUpNotes =
                    existingNotes + clientData.followUpDate;
                  clientData.followUpDate = null;
                }
              }

              // Import the client
              await createClient(clientData);
              successRows.push({ row: i + 1, client: clientData.clientName });

              console.log(`✓ Row ${i + 1} imported successfully`);
            } catch (rowError) {
              console.error(`Error in row ${i + 1}:`, rowError.message);
              errorRows.push({
                row: i + 1,
                error: rowError.message,
                data: rows[i],
              });
            }

            // Update progress
            const progress = Math.round((i / (rows.length - 1)) * 100);
            setImportProgress(progress);
          }

          // Set results
          setImportResults({
            total: rows.length - 1,
            success: successRows.length,
            errors: errorRows.length,
            errorDetails: errorRows,
          });

          setImportStatus("complete");

          // Show success message
          if (successRows.length > 0) {
            toast.success(
              `Successfully imported ${successRows.length} clients`
            );
          }
          if (errorRows.length > 0) {
            toast.warning(`${errorRows.length} clients failed to import`);
          }
        };

        reader.readAsText(importFile);
      });
    } catch (error) {
      console.error("Import error:", error);
      toast.error(`Import failed: ${error.message}`);
      setImportStatus("idle");
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    // CORRECTED TEMPLATE with proper followUpDate format
    const template = `clientName,companyName,clientDesignation,email,phone,city,companyAddress,category,gstin,tags,notes,followUpDate,followUpNotes
"Rajesh Malhotra","Malhotra Automobiles","Director","rajesh@malhotraauto.com","+91 1098765432","Jaipur","67 Tonk Road","regular","lead","08aabcm4567u1z8","automobile;new;showroom","2024-11-28","New automobile dealership opening soon."
"Pooja Verma","Verma Education Trust","Principal","pooja@vermaeducation.edu","+91 0987654321","Lucknow","34 Hazratganj","regular","regular","09aabcv7890v1z9","education;school;stationery","2024-12-20","School chain. Annual stationery and book orders."
"Amit Joshi","Joshi Realty","Real Estate Agent","amit@joshirealty.com","+91 9876501234","Surat","78 Athwa Lines","regular","prospect","24aabcj1234w1z0","realestate;property;residential","2024-12-08","Real estate agent with multiple property listings."`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded with proper date format!");
  };

  // Reset import
  const handleReset = () => {
    setImportFile(null);
    setImportStatus("idle");
    setImportProgress(0);
    setPreviewData([]);
    setCsvHeaders([]);
    setImportResults({
      total: 0,
      success: 0,
      errors: 0,
      errorDetails: [],
    });
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/customers")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Import Clients
              </h1>
              <p className="text-gray-600">Bulk import clients from CSV file</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center">
            {["upload", "preview", "import"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                    h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all
                    ${
                      activeTab === step
                        ? "border-violet-600 bg-violet-600 text-white"
                        : index <
                          ["upload", "preview", "import"].indexOf(activeTab)
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 bg-white text-gray-400"
                    }
                  `}
                  >
                    {index <
                    ["upload", "preview", "import"].indexOf(activeTab) ? (
                      <Check className="h-6 w-6" />
                    ) : step === "upload" ? (
                      <Upload className="h-6 w-6" />
                    ) : step === "preview" ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <RefreshCw className="h-6 w-6" />
                    )}
                  </div>
                  <span className="text-sm font-medium mt-2 capitalize">
                    {step === "upload"
                      ? "Upload CSV"
                      : step === "preview"
                      ? "Preview Data"
                      : "Import Results"}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`h-1 w-24 mx-4 ${
                      index < ["upload", "preview", "import"].indexOf(activeTab)
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger
                  value="upload"
                  disabled={importStatus === "uploading"}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  disabled={!importFile || importStatus === "uploading"}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Data
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  disabled={!importFile || importStatus === "uploading"}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Import Results
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center">
                    <Upload className="h-12 w-12 text-violet-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Upload CSV File
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    Upload a CSV file containing client data. The first row
                    should contain column headers.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  {/* File Upload Area */}
                  <div className="mb-8">
                    <div
                      className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                        ${
                          importFile
                            ? "border-green-500 bg-green-50/50"
                            : "border-gray-300 hover:border-violet-500 hover:bg-gray-50"
                        }
                        ${
                          importStatus === "parsing"
                            ? "pointer-events-none opacity-80"
                            : ""
                        }
                      `}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {importStatus === "parsing" ? (
                        <>
                          <RefreshCw className="h-12 w-12 text-violet-600 animate-spin mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-800">
                            Parsing CSV File...
                          </p>
                          <p className="text-gray-600">
                            Please wait while we read your file
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-800 mb-2">
                            {importFile
                              ? importFile.name
                              : "Drag & drop CSV file here"}
                          </p>
                          <p className="text-gray-600 mb-6">
                            {importFile
                              ? "File selected"
                              : "or click to browse"}
                          </p>
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-2 bg-violet-500 text-white hover:bg-violet-700"
                          >
                            Browse Files
                          </Button>
                          <p className="text-sm text-gray-500 mt-6">
                            Maximum file size: 10MB • Supported format: CSV
                          </p>
                        </>
                      )}
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* Template & Guidelines */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          CSV Format Guidelines
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-800">
                              Required Columns:
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>clientName</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>companyName</span>
                              </li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-800">
                              Important Note:
                            </h4>
                            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                              <p className="font-medium mb-1">
                                ⚠️ Date Format:
                              </p>
                              <p>
                                <code>followUpDate</code> must be in{" "}
                                <strong>YYYY-MM-DD</strong> format
                              </p>
                              <p>
                                Text descriptions should go in{" "}
                                <code>followUpNotes</code>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-mono space-y-1">
                            <div className="text-blue-600 font-medium">
                              clientName,companyName,email,phone,city,category,gstin,followUpDate,followUpNotes
                            </div>
                            <div className="text-gray-700">
                              "John Doe","Acme
                              Inc.","john@acme.com","+1234567890","New
                              York","regular","lead","2024-12-25","Follow up for
                              Christmas orders"
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="w-full justify-center gap-3 py-6 text-lg"
                    >
                      <Download className="h-5 w-5" />
                      Download CSV Template with Fixed Date Format
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Preview Data
                  </h2>
                  <p className="text-gray-600">
                    Review the data before importing. {importResults.total}{" "}
                    records found.
                  </p>
                </div>

                {previewData.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Data Preview (First 5 rows)
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Total rows in file: {importResults.total}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {csvHeaders.length} columns
                      </Badge>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {csvHeaders.map((header, index) => (
                                <th
                                  key={index}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {previewData.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                {csvHeaders.map((header, colIndex) => (
                                  <td
                                    key={colIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                  >
                                    {row[header] || (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between pt-6">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("upload")}
                      >
                        ← Back to Upload
                      </Button>
                      <Button
                        onClick={handleStartImport}
                        className="bg-gradient-to-r text-white from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        Start Import
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Import Results Tab */}
              <TabsContent value="import" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Import Results
                  </h2>
                  <p className="text-gray-600">
                    {importStatus === "uploading"
                      ? "Import in progress..."
                      : "Import completed"}
                  </p>
                </div>

                {importStatus === "uploading" ? (
                  <div className="text-center py-12">
                    <div className="relative w-32 h-32 mx-auto mb-8">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RefreshCw className="h-16 w-16 text-violet-600 animate-spin" />
                      </div>
                      <div className="w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="4"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#7C3AED"
                            strokeWidth="4"
                            strokeDasharray={`${importProgress}, 100`}
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Importing {importResults.total} Clients
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {importProgress}% complete
                    </p>
                    <p className="text-sm text-gray-500">
                      Please don't close this window during import
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Results Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-0 shadow-md">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {importResults.total}
                          </div>
                          <div className="text-gray-600">Total Records</div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-md border-l-4 border-l-green-500">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {importResults.success}
                          </div>
                          <div className="text-gray-600">
                            Successfully Imported
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-md border-l-4 border-l-red-500">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-red-600 mb-2">
                            {importResults.errors}
                          </div>
                          <div className="text-gray-600">Failed Imports</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Error Details */}
                    {importResults.errorDetails.length > 0 && (
                      <Card className="border-0 shadow-md border-red-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            Import Errors ({importResults.errorDetails.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {importResults.errorDetails.map((error, index) => (
                              <div
                                key={index}
                                className="p-3 bg-red-50 rounded-lg border border-red-100"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-800">
                                        Row {error.row}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-red-600 border-red-200"
                                      >
                                        Error
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-red-600">
                                      {error.error}
                                    </p>
                                    {error.data && (
                                      <pre className="text-xs text-gray-500 mt-2 bg-white p-2 rounded border overflow-x-auto">
                                        {error.data}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Success Message */}
                    {importResults.success > 0 && (
                      <Card className="border-0 shadow-md border-green-100">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <Check className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Import Successful!
                              </h4>
                              <p className="text-gray-600">
                                {importResults.success} clients have been added
                                to the system.
                                {importResults.errors > 0 &&
                                  ` ${importResults.errors} records failed to import.`}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6">
                      <div className="space-x-3">
                        <Button variant="outline" onClick={handleReset}>
                          Import Another File
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate("/dashboard/customers")}
                        >
                          View All Clients
                        </Button>
                      </div>
                      <Button
                        onClick={() => navigate("/dashboard/customers")}
                        className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
                      >
                        Go to Clients Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
