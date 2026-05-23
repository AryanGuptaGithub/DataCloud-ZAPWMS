// src/pages/Expense/ImportExpense.jsx
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
import { createExpense } from "@/lib/expenses";
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
  DollarSign,
  Calendar,
  Tag,
  User,
  Receipt,
} from "lucide-react";

export default function ImportExpense() {
  const navigate = useNavigate();
  const { withLoader } = useLoading();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("upload");
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState("idle");
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

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target.result;
        const rows = csvData.split("\n").filter((row) => row.trim());

        if (rows.length < 2) {
          throw new Error("CSV file is empty or has only headers");
        }

        const headers = rows[0].split(",").map((h) => h.trim());
        setCsvHeaders(headers);

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

          console.log("=== EXPENSE CSV IMPORT DEBUG ===");
          console.log("Headers:", headers);

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

              // Create expense object with proper mapping
              const expenseData = {
                title: values[0] || "Untitled Expense",
                amount: parseFloat(values[1]) || 0,
                vendor: values[2] || "",
                date: values[3] || new Date().toISOString().split("T")[0],
                category: values[4] || "other",
                paymentMethod: values[5] || "cash",
                isRecurring: values[6]?.toLowerCase() === "yes" || values[6]?.toLowerCase() === "true",
                notes: values[7] || "",
              };

              console.log(`Row ${i + 1} processed:`, expenseData);

              // Validate required fields
              if (!expenseData.title || expenseData.amount <= 0) {
                throw new Error(
                  "Missing required fields: title and amount must be greater than 0"
                );
              }

              // Validate date format
              if (expenseData.date && !/^\d{4}-\d{2}-\d{2}$/.test(expenseData.date)) {
                throw new Error(`Invalid date format: ${expenseData.date}. Use YYYY-MM-DD format`);
              }

              // Validate amount
              if (isNaN(expenseData.amount) || expenseData.amount <= 0) {
                throw new Error(`Invalid amount: ${values[1]}`);
              }

              // Fix category validation
              const validCategories = [
                "food",
                "travel",
                "utilities",
                "shopping",
                "entertainment",
                "office",
                "rent",
                "salary",
                "marketing",
                "maintenance",
                "software",
                "other",
              ];
              if (!validCategories.includes(expenseData.category.toLowerCase())) {
                console.warn(
                  `Invalid category "${expenseData.category}", defaulting to "other"`
                );
                expenseData.category = "other";
              }

              // Fix payment method validation
              const validPaymentMethods = ["cash", "card", "bank", "online", "check"];
              if (!validPaymentMethods.includes(expenseData.paymentMethod.toLowerCase())) {
                console.warn(
                  `Invalid payment method "${expenseData.paymentMethod}", defaulting to "cash"`
                );
                expenseData.paymentMethod = "cash";
              }

              // Import the expense
              await createExpense(expenseData);
              successRows.push({ row: i + 1, expense: expenseData.title });

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
            toast.success(`Successfully imported ${successRows.length} expense records`);
          }
          if (errorRows.length > 0) {
            toast.warning(`${errorRows.length} expense records failed to import`);
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
    const template = `title,amount,vendor,date,category,paymentMethod,isRecurring,notes
"Office Rent",30000.00,"Landlord Corp","2024-12-01","rent","bank","Yes","Monthly office rent payment"
"Team Lunch",5000.00,"Restaurant","2024-12-05","food","card","No","Team outing celebration"
"Software Subscription",15000.00,"Software Inc","2024-12-10","software","online","Yes","Annual subscription"
"Travel Expenses",8500.00,"Travel Agency","2024-11-28","travel","cash","No","Client meeting travel"
"Marketing Campaign",25000.00,"Marketing Agency","2024-11-20","marketing","bank","No","Q4 marketing campaign"
"Office Supplies",3500.00,"Stationery Store","2024-11-15","office","card","No","Printer paper and ink"
"Internet Bill",2500.00,"ISP Company","2024-11-10","utilities","online","Yes","Monthly internet bill"
"Employee Salary",150000.00,"Payroll","2024-11-05","salary","bank","Yes","Monthly salary payout"`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Expense template downloaded!");
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-4 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/expenses")}
              className="gap-2 bg-gray-200 dark:bg-gray-800 border-gray-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Expenses
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Import Expense Records
              </h1>
              <p className="text-gray-600">
                Bulk import expense transactions from CSV file
              </p>
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
                        ? "border-rose-600 bg-rose-600 text-white"
                        : index <
                          ["upload", "preview", "import"].indexOf(activeTab)
                        ? "border-rose-500 bg-rose-500 text-white"
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
                        ? "bg-rose-500"
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
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full flex items-center justify-center">
                    <Upload className="h-12 w-12 text-rose-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Upload CSV File
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    Upload a CSV file containing expense data. The first row
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
                            ? "border-rose-500 bg-rose-50/50"
                            : "border-gray-300 hover:border-rose-500 hover:bg-gray-50"
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
                          <RefreshCw className="h-12 w-12 text-rose-600 animate-spin mx-auto mb-4" />
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
                            className="border-2 bg-rose-500 text-white hover:bg-rose-700"
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
                                <span>title</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>amount</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>date (YYYY-MM-DD)</span>
                              </li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-800">
                              Optional Columns:
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>vendor, category</li>
                              <li>paymentMethod, isRecurring</li>
                              <li>notes</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                          <div className="text-sm space-y-2">
                            <div className="font-semibold text-rose-800 flex items-center gap-2">
                              <Receipt className="h-4 w-4" />
                              Important Notes:
                            </div>
                            <ul className="text-rose-700 space-y-1 text-sm">
                              <li>• Date must be in <code>YYYY-MM-DD</code> format</li>
                              <li>• Amount must be a number (e.g., 25000.00)</li>
                              <li>• Category: food, travel, utilities, shopping, office, etc.</li>
                              <li>• Payment Method: cash, card, bank, online, check</li>
                              <li>• isRecurring: yes/no or true/false</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-mono space-y-1">
                            <div className="text-blue-600 font-medium">
                              title,amount,vendor,date,category,paymentMethod,isRecurring,notes
                            </div>
                            <div className="text-gray-700">
                              "Office Rent",30000.00,"Landlord","2024-12-01","rent","bank","Yes","Monthly payment"
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="w-full justify-center gap-3 py-6 text-lg bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 hover:from-rose-100 hover:to-rose-200"
                    >
                      <Download className="h-5 w-5 text-rose-600" />
                      Download CSV Template
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
                                  <div className="flex items-center gap-2">
                                    {header === "title" && <FileText className="h-3 w-3" />}
                                    {header === "amount" && <DollarSign className="h-3 w-3" />}
                                    {header === "date" && <Calendar className="h-3 w-3" />}
                                    {header === "category" && <Tag className="h-3 w-3" />}
                                    {header === "vendor" && <User className="h-3 w-3" />}
                                    {header === "isRecurring" && <Receipt className="h-3 w-3" />}
                                    {header}
                                  </div>
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
                        className="bg-gradient-to-r text-white from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
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
                        <RefreshCw className="h-16 w-16 text-rose-600 animate-spin" />
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
                            stroke="#F43F5E"
                            strokeWidth="4"
                            strokeDasharray={`${importProgress}, 100`}
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Importing {importResults.total} Expense Records
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
                      <Card className="border-0 shadow-md border-l-4 border-l-rose-500">
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-rose-600 mb-2">
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
                      <Card className="border-0 shadow-md border-rose-100">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                              <Check className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Import Successful!
                              </h4>
                              <p className="text-gray-600">
                                {importResults.success} expense records have been
                                added to the system.
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
                          onClick={() => navigate("/dashboard/expenses")}
                        >
                          View All Expenses
                        </Button>
                      </div>
                      <Button
                        onClick={() => navigate("/dashboard/expenses")}
                        className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800"
                      >
                        Go to Expenses Dashboard
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