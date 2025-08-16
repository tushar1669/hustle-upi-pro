import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Building2, Percent, CreditCard, Palette, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCelebrationContext } from "@/components/CelebrationProvider";
import { toast } from "@/hooks/use-toast";

interface OnboardingData {
  businessName: string;
  logoFile: File | null;
  gstPercent: string;
  paymentMethod: string;
  themeConfirmed: boolean;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

const steps = [
  { id: 1, title: "Business Details", icon: Building2 },
  { id: 2, title: "Upload Logo", icon: Upload },
  { id: 3, title: "GST Preference", icon: Percent },
  { id: 4, title: "Payment Method", icon: CreditCard },
  { id: 5, title: "Theme Selection", icon: Palette },
];

export function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    logoFile: null,
    gstPercent: "18",
    paymentMethod: "upi",
    themeConfirmed: false,
  });
  const { celebrate } = useCelebrationContext();

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Completion
      celebrate("task_done");
      onComplete(data);
      toast({
        title: "Welcome to HustleHub! 🎉",
        description: "Your business setup is complete. Let's start building your success!",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setData({ ...data, logoFile: file });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.businessName.trim().length > 0;
      case 2:
        return true; // Logo is optional
      case 3:
        return data.gstPercent !== "";
      case 4:
        return data.paymentMethod !== "";
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Building2 className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">What's your business name?</h3>
              <p className="text-muted-foreground">This will appear on your invoices and dashboard</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Your Business Name"
                value={data.businessName}
                onChange={(e) => setData({ ...data, businessName: e.target.value })}
                className="text-center"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Upload className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Upload your logo</h3>
              <p className="text-muted-foreground">Add your brand identity (optional but recommended)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Business Logo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("logo")?.click()}
                  className="w-full"
                >
                  {data.logoFile ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      {data.logoFile.name}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Choose File
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Percent className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">GST Preference</h3>
              <p className="text-muted-foreground">Select your default GST rate for invoices</p>
            </div>
            <div className="space-y-2">
              <Label>Default GST Rate</Label>
              <Select value={data.gstPercent} onValueChange={(value) => setData({ ...data, gstPercent: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select GST rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% - Exempt</SelectItem>
                  <SelectItem value="6">6% - Essential goods</SelectItem>
                  <SelectItem value="12">12% - Standard items</SelectItem>
                  <SelectItem value="18">18% - Services (Recommended)</SelectItem>
                  <SelectItem value="30">30% - Luxury items</SelectItem>
                  <SelectItem value="custom">Custom rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <CreditCard className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Payment Method</h3>
              <p className="text-muted-foreground">How do you prefer to receive payments?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className={`cursor-pointer transition-all ${data.paymentMethod === "upi" ? "ring-2 ring-primary" : ""}`}
                onClick={() => setData({ ...data, paymentMethod: "upi" })}
              >
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl mb-2">📱</div>
                  <p className="font-medium">UPI</p>
                  <Badge variant="success" className="mt-1">Recommended</Badge>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all ${data.paymentMethod === "bank" ? "ring-2 ring-primary" : ""}`}
                onClick={() => setData({ ...data, paymentMethod: "bank" })}
              >
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl mb-2">🏦</div>
                  <p className="font-medium">Bank Transfer</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Palette className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Theme Selection</h3>
              <p className="text-muted-foreground">Your brand colors look great! Ready to proceed?</p>
            </div>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                  HustleHub Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary rounded-full"></div>
                  <div className="w-8 h-8 bg-accent rounded-full"></div>
                  <div className="w-8 h-8 bg-success rounded-full"></div>
                  <div className="w-8 h-8 bg-warning rounded-full"></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Professional teal and vibrant orange - perfect for your business identity
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setData({ ...data, themeConfirmed: !data.themeConfirmed })}
                >
                  {data.themeConfirmed ? "✓ Confirmed" : "Confirm Theme"}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Welcome to HustleHub! 🚀
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id < currentStep
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
                Skip Setup
              </Button>
            </div>
            <Button 
              onClick={handleNext} 
              disabled={!canProceed()}
              className="min-w-20"
            >
              {currentStep === steps.length ? "Complete" : "Next"}
            </Button>
          </div>

          {/* Benefits */}
          {currentStep === 1 && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                ✨ Complete setup for personalized invoices, automated reminders, and business insights
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}