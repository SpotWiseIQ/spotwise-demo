import React, { useState, FormEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { analyzeBusiness } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";

// Icons
import { Building, Briefcase, MapPin, Lightbulb } from "lucide-react";

export default function LandingPage(): JSX.Element {
  const [businessRequirement, setBusinessRequirement] = useState<string>("");
  const [businessType, setBusinessType] = useState<string>("");
  const [business, setBusiness] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [intent, setIntent] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Add a memoized business options based on business type
  const businessOptions = useMemo(() => {
    switch (businessType.toLowerCase()) {
      case 'static':
        return [{ value: 'Car Wash', label: 'Car Wash' }];
      case 'mobile':
        return [
          { value: 'Food Stall', label: 'Food Stall' },
          { value: 'Artisan Stall', label: 'Artisan Stall' }
        ];
      default:
        return [];
    }
  }, [businessType]);

  const handleAnalysisSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessRequirement.trim()) {
      toast({
        title: "Please enter a business requirement",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const preferences = await analyzeBusiness(businessRequirement);

      // Update form values based on API response
      setBusinessType(preferences.business_type);
      setBusiness(preferences.business);
      setLocation(preferences.location);
      setIntent(preferences.intent);
    } catch (error) {
      toast({
        title: "Error analyzing business requirement",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRedirect = () => {
    // Debug log
    console.log('Redirecting with:', { businessType, business, location });

    if (businessType.toLowerCase() === "mobile" && location === "Tampere") {
      // Add business and location parameters for mobile business too
      if (business) {
        // navigate(`/mobile-business?business=${encodeURIComponent(business)}&location=${encodeURIComponent(location)}`);
        navigate(`/events?business=${encodeURIComponent(business)}&location=${encodeURIComponent(location)}`);
        // navigate("/events");

      } else {
        toast({
          title: "Please select a business",
          description: "You need to select a business before proceeding",
          variant: "destructive",
        });
      }
    } else if (businessType.toLowerCase() === "static" && location === "Tampere") {
      // Only navigate if we have a business selected
      if (business) {
        navigate(`/static-business?business=${encodeURIComponent(business)}&location=${encodeURIComponent(location)}`);
      } else {
        toast({
          title: "Please select a business",
          description: "You need to select a business before proceeding",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="max-w-4xl w-full px-4">
        <h1 className="text-3xl font-bold text-center text-[#29549a] drop-shadow-sm mb-2">
          SpotWise
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Find the Best Spot for your Business
        </p>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-end -mt-2 -mb-1">
              <LanguageSelector />
            </div>
            <div className="space-y-6">
              {/* Analysis Form */}
              <form onSubmit={handleAnalysisSubmit} className="pt-1">
                <Label
                  htmlFor="requirement"
                  className="text-base font-medium underline"
                >
                  Enter Business Requirement
                </Label>
                <Input
                  id="requirement"
                  placeholder="I want to open a car wash in Tampere..."
                  value={businessRequirement}
                  onChange={(e) => setBusinessRequirement(e.target.value)}
                  className="mt-2 mb-2"
                />
                <p className="text-right mt-1 text-sm text-purple-700">
                  (e.g., &quot;Find a spot to open a food truck in Tampere&quot;)
                </p>
                <Button
                  type="submit"
                  variant="secondary"
                  className="mt-2"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </form>

              <div className="border-b border-gray-300" />

              {/* Business Preferences Display */}
              <div className="flex flex-col items-center">
                <div className="text-center w-full mb-4">
                  <Label className="underline">Business Preferences:</Label>
                </div>
                <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-3xl">
                  {/* Column 1: Business Type and Location */}
                  <div className="flex flex-col space-y-4 px-2">
                    {/* Business Type */}
                    <div className="flex flex-col gap-2">
                      <Label>Business Type</Label>
                      <Select
                        value={businessType}
                        onValueChange={setBusinessType}
                      >
                        <SelectTrigger className="flex items-center pl-2">
                          <Building className="w-4 h-4 mr-2 text-gray-600" />
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Static">Static</SelectItem>
                          <SelectItem value="Mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="flex flex-col gap-2">
                      <Label>Location</Label>
                      <Select
                        value={location}
                        onValueChange={setLocation}
                        defaultValue="Tampere"
                      >
                        <SelectTrigger className="flex items-center pl-2">
                          <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tampere">Tampere</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Column 2: Business and Intent */}
                  <div className="flex flex-col space-y-4 px-2">
                    {/* Business */}
                    <div className="flex flex-col gap-2">
                      <Label>Business</Label>
                      <Select
                        value={business}
                        onValueChange={setBusiness}
                      >
                        <SelectTrigger className="flex items-center pl-2">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-600" />
                          <SelectValue placeholder="Select business" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Intent */}
                    <div className="flex flex-col gap-2">
                      <Label>Intent</Label>
                      <Select
                        value={intent}
                        onValueChange={setIntent}
                      >
                        <SelectTrigger className="flex items-center pl-2">
                          <Lightbulb className="w-4 h-4 mr-2 text-gray-600" />
                          <SelectValue placeholder="Select intent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Setup">Setup</SelectItem>
                          <SelectItem value="Research">Research</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Column 3: Button */}
                  <div className="flex justify-center items-center">
                    <Button
                      onClick={handleRedirect}
                      className="px-6 py-2"
                      disabled={!businessType}
                    >
                      Find my spot
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 