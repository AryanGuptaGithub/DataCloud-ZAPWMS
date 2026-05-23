import { useState, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Tag,
  Calendar,
  MessageSquare,
  FileText,
  Paperclip,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/clients";
import { toast } from "sonner";

// Memoized Input Component to prevent re-renders
const MemoizedInput = memo(
  ({ label, value, onChange, placeholder, type = "text", className = "" }) => (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border-0 shadow-sm text-sm sm:text-base ${className}`}
      />
    </div>
  )
);

MemoizedInput.displayName = "MemoizedInput";

// Memoized Textarea Component
const MemoizedTextarea = memo(
  ({ label, value, onChange, placeholder, rows = 3, className = "" }) => (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base">{label}</Label>
      <Textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`border-0 shadow-sm text-sm sm:text-base ${className}`}
      />
    </div>
  )
);

MemoizedTextarea.displayName = "MemoizedTextarea";

// Mobile Sidebar for step navigation
const MobileStepDrawer = ({
  isOpen,
  onClose,
  steps,
  activeStep,
  setActiveStep,
}) => (
  <>
    {/* Overlay */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
    )}

    {/* Drawer */}
    <div
      className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Navigation
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <nav className="p-4">
        <div className="space-y-1">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                setActiveStep(step.id);
                onClose();
              }}
              className={`flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors ${
                activeStep === step.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                {step.icon}
                <span className="font-medium">{step.title}</span>
              </div>
              {activeStep === step.id && (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  </>
);

export default function ClientManagement() {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [tagInput, setTagInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const [client, setClient] = useState({
    clientName: "",
    companyName: "",
    clientDesignation: "",
    companyAddress: "",
    city: "",
    phone: "",
    email: "",
    gstin: "",
    category: "regular",
    tags: [],
    notes: "",
    followUpDate: "",
    followUpNotes: "",
  });

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const steps = [
    { id: 1, title: "Basic Info", icon: <User className="h-4 w-4" /> },
    { id: 2, title: "Classification", icon: <Tag className="h-4 w-4" /> },
    {
      id: 3,
      title: "Notes & Follow-up",
      icon: <Calendar className="h-4 w-4" />,
    },
    { id: 4, title: "Documents", icon: <Paperclip className="h-4 w-4" /> },
  ];

  const validateClientData = () => {
    const errors = [];

    if (!client.clientName.trim()) errors.push("Client Name is required");
    if (!client.companyName.trim()) errors.push("Company Name is required");
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      errors.push("Invalid email format");
    }

    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateClientData();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join("\n"), { duration: 4000 });
      return;
    }

    try {
      if (!client.clientName.trim() || !client.companyName.trim()) {
        toast.error("Client Name and Company Name are required!", {
          duration: 3000,
        });
        return;
      }

      setLoading(true);

      const createdClient = await createClient(client);

      console.log("✅ Client saved successfully:", createdClient);

      toast.success("Client saved successfully!", { duration: 3000 });

      // Use navigate instead of window.location for SPA navigation
      navigate("/dashboard/customers");
    } catch (error) {
      console.error("❌ Error saving client:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to save client. Please try again.";
      toast.error(`Error: ${errorMessage}`, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setClient((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !client.tags.includes(tagInput.trim())) {
      setClient((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setClient((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-md sm:shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <MemoizedInput
                    label="Client Name *"
                    value={client.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    placeholder="John Doe"
                  />
                  <MemoizedInput
                    label="Company Name *"
                    value={client.companyName}
                    onChange={(e) =>
                      handleChange("companyName", e.target.value)
                    }
                    placeholder="Acme Inc."
                  />
                  <MemoizedInput
                    label="Designation"
                    value={client.clientDesignation}
                    onChange={(e) =>
                      handleChange("clientDesignation", e.target.value)
                    }
                    placeholder="CEO, Manager, etc."
                  />
                  <MemoizedInput
                    label="City"
                    value={client.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Mumbai"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md sm:shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <MemoizedInput
                    label="Email"
                    type="email"
                    value={client.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john@example.com"
                  />
                  <MemoizedInput
                    label="Phone"
                    value={client.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91 9876543210"
                  />
                  <MemoizedInput
                    label="GSTIN"
                    value={client.gstin}
                    onChange={(e) => handleChange("gstin", e.target.value)}
                    placeholder="27AAAAA0000A1Z5"
                  />
                </div>
                <MemoizedTextarea
                  label="Company Address"
                  value={client.companyAddress}
                  onChange={(e) =>
                    handleChange("companyAddress", e.target.value)
                  }
                  placeholder="123 Business Street, Commercial Area"
                  rows={2}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-md sm:shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                  Client Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                  {["premium", "regular", "lead", "inactive", "prospect"].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleChange("category", cat)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                          client.category === cat
                            ? "border-violet-500 bg-violet-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-center">
                          <div
                            className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full mx-auto mb-1 sm:mb-2 ${
                              cat === "premium"
                                ? "bg-yellow-500"
                                : cat === "regular"
                                ? "bg-blue-500"
                                : cat === "lead"
                                ? "bg-green-500"
                                : cat === "inactive"
                                ? "bg-gray-500"
                                : "bg-purple-500"
                            }`}
                          />
                          <span className="font-medium capitalize text-xs sm:text-sm">
                            {cat}
                          </span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md sm:shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Tags & Labels
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag (press Enter)"
                    className="border-0 shadow-sm text-sm sm:text-base"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddTag}
                    type="button"
                    className="sm:w-auto"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="gap-2 text-xs sm:text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-md sm:shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  Client Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <MemoizedTextarea
                  value={client.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Enter detailed notes about the client, requirements, preferences, etc."
                  rows={4}
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md sm:shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Follow-up Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <MemoizedInput
                    label="Follow-up Date"
                    type="date"
                    value={client.followUpDate}
                    onChange={(e) =>
                      handleChange("followUpDate", e.target.value)
                    }
                  />
                </div>
                <MemoizedTextarea
                  label="Follow-up Notes"
                  value={client.followUpNotes}
                  onChange={(e) =>
                    handleChange("followUpNotes", e.target.value)
                  }
                  placeholder="What to discuss in the next follow-up..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-md sm:shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                  Document Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center hover:border-violet-500 transition-colors">
                  <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                  <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                    Drag & drop files here or click to browse
                  </p>
                  <Button variant="outline" size={isMobile ? "sm" : "default"}>
                    Browse Files
                  </Button>
                  <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    Supports PDF, DOC, Images up to 10MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <MobileStepDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        steps={steps}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
      />

      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant=""
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2 bg-amber-200 hover:bg-amber-400 hover:text-white text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Back to Clients</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  Add New Client
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Create a new client record
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="icon"
                className="sm:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="gap-2 bg-gradient-to-r text-white from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-sm sm:text-base"
                size={isMobile ? "sm" : "default"}
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  {loading ? "Saving..." : "Save Client"}
                </span>
                <span className="sm:hidden">
                  {loading ? "Saving..." : "Save"}
                </span>
              </Button>
            </div>
          </div>

          {/* Progress Steps - Hidden on mobile */}
          <div className="hidden sm:block mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                        activeStep >= step.id
                          ? "bg-violet-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {activeStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span className="text-sm font-medium mt-2">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 w-16 mx-4 ${
                        activeStep > step.id ? "bg-violet-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Step Indicator */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium">
                Step {activeStep} of {steps.length}
              </span>
              <span className="text-sm text-gray-600">
                {steps[activeStep - 1]?.title}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-violet-600 transition-all duration-300"
                style={{ width: `${(activeStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Step Navigation - Desktop only */}
          <div className="hidden sm:flex justify-center mb-8">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              {steps.map((step) => (
                <Button
                  key={step.id}
                  variant={activeStep === step.id ? "default" : "ghost"}
                  onClick={() => setActiveStep(step.id)}
                  className={`gap-2 text-sm ${
                    activeStep === step.id ? "bg-white shadow" : ""
                  }`}
                  size="sm"
                >
                  {step.icon}
                  {step.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6 sm:mb-8">{renderStepContent()}</div>

          {/* Step Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="bg-gray-400 text-white hover:bg-gray-500 text-sm"
              size={isMobile ? "sm" : "default"}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2 sm:gap-3">
              {/* Mobile Step Indicator */}
              {isMobile && activeStep < steps.length && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">
                    Step {activeStep}
                  </span>
                  <div className="h-1 w-8 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-600"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{steps.length}</span>
                </div>
              )}

              {activeStep < steps.length ? (
                <Button
                  onClick={() =>
                    setActiveStep((prev) => Math.min(steps.length, prev + 1))
                  }
                  className="bg-violet-600 text-white hover:bg-violet-700 text-sm"
                  size={isMobile ? "sm" : "default"}
                >
                  <span className="hidden sm:inline">Next Step</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-sm"
                  size={isMobile ? "sm" : "default"}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {loading ? "Saving..." : "Save Client"}
                  </span>
                  <span className="sm:hidden">
                    {loading ? "Saving..." : "Save"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
