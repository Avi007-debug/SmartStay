import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HiddenChargeDetector } from "@/components/ai/HiddenChargeDetector";
import { SentimentSummary } from "@/components/ai/SentimentSummary";
import { 
  Upload, CheckCircle, AlertCircle, Image, MapPin, DollarSign, 
  Bed, Clock, Shield, Sparkles, Eye, Building2, Phone, Users, HelpCircle, X, Loader2
} from "lucide-react";
import { pgService, storageService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const PostRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ file: File, preview: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    roomType: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    college: "",
    distance: "",
    rent: "",
    deposit: "",
    totalBeds: "",
    availableBeds: "",
    curfew: "",
    rules: "",
    amenities: [] as string[],
    cleanlinessLevel: [3],
    strictnessLevel: [3],
    whatsappGroup: "",
    description: "",
    foodIncluded: false,
    maintenanceCharges: "",
    electricityCharges: "",
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;
  const isEditMode = !!id;

  useEffect(() => {
    if (id) {
      loadPGData();
    }
  }, [id]);

  const loadPGData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const pg = await pgService.getById(id);
      if (pg) {
        console.log('Loaded PG data:', pg); // Debug log
        // Populate form with existing data
        setFormData({
          name: pg.name || "",
          gender: pg.gender || pg.gender_preference || "",
          roomType: pg.room_type || "",
          address: typeof pg.address === 'string' ? pg.address : (pg.address?.street || pg.address?.full || ""),
          city: pg.city || (typeof pg.address === 'object' ? pg.address?.city : ""),
          state: typeof pg.address === 'object' ? pg.address?.state || "" : "",
          pincode: typeof pg.address === 'object' ? pg.address?.pincode || "" : "",
          college: pg.nearest_college || "",
          distance: pg.distance_from_college?.toString() || "",
          rent: (pg.rent || pg.monthly_rent)?.toString() || "",
          deposit: pg.deposit?.toString() || "",
          totalBeds: pg.total_beds?.toString() || "",
          availableBeds: pg.available_beds?.toString() || "",
          curfew: typeof pg.rules === 'object' ? pg.rules?.curfewTime || "" : "",
          rules: typeof pg.rules === 'object' ? pg.rules?.customRules || "" : (pg.rules || ""),
          amenities: pg.amenities || [],
          cleanlinessLevel: [pg.cleanliness_level || 3],
          strictnessLevel: [pg.strictness_level || 3],
          whatsappGroup: pg.whatsapp_group_link || "",
          description: pg.description || "",
          foodIncluded: pg.amenities?.includes("Food Included") || false,
          maintenanceCharges: pg.maintenance_charges?.toString() || "",
          electricityCharges: pg.electricity_charges || "",
        });

        // Load existing images as preview URLs
        if (pg.images && Array.isArray(pg.images) && pg.images.length > 0) {
          const imageObjects = pg.images.map((url: string) => ({
            file: null as any, // No actual file for existing images
            preview: url,
            isExisting: true // Flag to identify existing images
          }));
          setUploadedImages(imageObjects);
        }
      }
    } catch (error) {
      console.error('Error loading PG data:', error);
      toast({
        title: "Error",
        description: "Failed to load PG data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const amenities = [
    "Wi-Fi", "Food Included", "Hot Water", "Laundry", "AC", "Parking",
    "TV", "Fridge", "Gym", "CCTV", "Power Backup", "Attached Bathroom",
    "Geyser", "RO Water", "Housekeeping", "Study Table", "Almirah",
    "Washing Machine", "Microwave", "Balcony", "Lift", "Security Guard"
  ];

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const generateDescription = async () => {
    if (!formData.amenities.length || !formData.rent) {
      toast({
        title: "Missing Information",
        description: "Please add amenities and rent first",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingDescription(true);
      const response = await axios.post(`http://localhost:5000/api/ai/generate-description`, {
        name: formData.name,
        gender: formData.gender,
        room_type: formData.roomType,
        city: formData.city,
        rent: parseInt(formData.rent),
        amenities: formData.amenities,
        rules: formData.rules,
      });

      setFormData(prev => ({ ...prev, description: response.data.description }));
      toast({
        title: "Success!",
        description: "AI description generated successfully",
      });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Step 1: Basic Info Validation
    if (!formData.name || formData.name.trim().length < 3) {
      toast({
        title: "Invalid PG Name",
        description: "PG name must be at least 3 characters long",
        variant: "destructive",
      });
      setStep(1);
      return;
    }

    if (!formData.gender || !formData.roomType) {
      toast({
        title: "Missing Information",
        description: "Please select gender preference and room type",
        variant: "destructive",
      });
      setStep(1);
      return;
    }

    // Step 2: Location Validation
    if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in complete address details",
        variant: "destructive",
      });
      setStep(2);
      return;
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      toast({
        title: "Invalid Pincode",
        description: "Pincode must be 6 digits",
        variant: "destructive",
      });
      setStep(2);
      return;
    }

    // Step 3: Pricing Validation
    if (!formData.rent || !formData.deposit || !formData.availableBeds) {
      toast({
        title: "Missing Pricing Information",
        description: "Please fill in rent, deposit, and available beds",
        variant: "destructive",
      });
      setStep(3);
      return;
    }

    const rent = parseInt(formData.rent);
    const deposit = parseInt(formData.deposit);
    const beds = parseInt(formData.availableBeds);

    if (rent < 1000 || rent > 100000) {
      toast({
        title: "Invalid Rent",
        description: "Rent must be between ₹1,000 and ₹1,00,000",
        variant: "destructive",
      });
      setStep(3);
      return;
    }

    if (deposit < 0 || deposit > rent * 12) {
      toast({
        title: "Invalid Deposit",
        description: "Deposit seems unreasonable. Please check the amount",
        variant: "destructive",
      });
      setStep(3);
      return;
    }

    if (beds < 1 || beds > 50) {
      toast({
        title: "Invalid Beds Count",
        description: "Available beds must be between 1 and 50",
        variant: "destructive",
      });
      setStep(3);
      return;
    }

    // Step 4: Photos Validation
    if (uploadedImages.length < 3) {
      toast({
        title: "Photos Required",
        description: "Please upload at least 3 photos of your property",
        variant: "destructive",
      });
      setStep(4);
      return;
    }

    if (uploadedImages.length > 10) {
      toast({
        title: "Too Many Photos",
        description: "Maximum 10 photos allowed. Please remove some",
        variant: "destructive",
      });
      setStep(4);
      return;
    }

    try {
      setSubmitting(true);

      // Create the PG listing first (without images)
      const listingData = {
        name: formData.name,
        description: formData.description || formData.rules,
        gender: formData.gender,
        room_type: formData.roomType,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          full: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        },
        rent: parseInt(formData.rent),
        deposit: parseInt(formData.deposit),
        total_beds: parseInt(formData.totalBeds) || parseInt(formData.availableBeds),
        available_beds: parseInt(formData.availableBeds),
        amenities: formData.amenities,
        rules: {
          curfewTime: formData.curfew || null,
          guestsAllowed: false,
          smokingAllowed: false,
          petsAllowed: false,
          customRules: formData.rules || null,
        },
        maintenance_charges: formData.maintenanceCharges ? parseInt(formData.maintenanceCharges) : 0,
        electricity_charges: formData.electricityCharges || "As per usage",
        whatsapp_group_link: formData.whatsappGroup || null,
        cleanliness_level: formData.cleanlinessLevel[0],
        strictness_level: formData.strictnessLevel[0],
        distance_from_college: formData.distance ? parseFloat(formData.distance) : null,
        nearest_college: formData.college || null,
        is_available: parseInt(formData.availableBeds) > 0,
        status: 'active',
      };

      let pgId: string;
      
      if (isEditMode && id) {
        // Update existing PG
        await pgService.update(id, listingData);
        pgId = id;
      } else {
        // Create new PG
        const createdPG = await pgService.create(listingData);
        pgId = createdPG.id;
      }
      
      // Separate existing images from new uploads
      const existingImageUrls: string[] = [];
      const newImages: { file: File, preview: string }[] = [];
      
      for (const image of uploadedImages) {
        if ((image as any).isExisting) {
          // Keep existing image URLs
          existingImageUrls.push(image.preview);
        } else if (image.file) {
          // New images to upload
          newImages.push(image);
        }
      }
      
      // Upload new images
      const newImageUrls: string[] = [];
      for (const { file } of newImages) {
        try {
          const { url } = await storageService.uploadPGImage(file, pgId);
          newImageUrls.push(url);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }

      // Combine existing and new image URLs
      const allImageUrls = [...existingImageUrls, ...newImageUrls];
      
      // Update PG with all image URLs
      if (allImageUrls.length > 0) {
        await pgService.update(pgId, {
          images: allImageUrls
        });
      }

      toast({
        title: "Success!",
        description: isEditMode ? "Your PG listing has been updated successfully" : "Your PG listing has been published successfully",
      });

      // Navigate to the listing detail page
      navigate(`/pg/${pgId}`);

    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ["Basic Info", "Pricing", "Amenities & Rules", "Photos", "Preview"];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isEditMode ? "Edit Your Property" : "List Your Property"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? "Update the details of your PG listing" : "Fill in the details to create your PG listing"}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2 mb-4" />
              <div className="flex justify-between">
                {stepLabels.map((label, index) => (
                  <div 
                    key={label}
                    className={`text-xs text-center ${step > index ? "text-primary font-medium" : "text-muted-foreground"}`}
                  >
                    <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs ${
                      step > index ? "bg-primary text-primary-foreground" : 
                      step === index + 1 ? "bg-primary/20 text-primary" : "bg-muted"
                    }`}>
                      {step > index + 1 ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className="hidden sm:block">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <form className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <Card className="border-2 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Tell us about your property</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g., Sunshine PG for Boys" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender Preference *</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boys">Boys Only</SelectItem>
                          <SelectItem value="girls">Girls Only</SelectItem>
                          <SelectItem value="any">Co-ed / Any</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Room Type *</Label>
                      <Select value={formData.roomType} onValueChange={(v) => setFormData({...formData, roomType: v})}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Occupancy</SelectItem>
                          <SelectItem value="double">Double Sharing</SelectItem>
                          <SelectItem value="triple">Triple Sharing</SelectItem>
                          <SelectItem value="quad">4+ Sharing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address *</Label>
                    <Textarea 
                      id="address" 
                      placeholder="Enter street address with landmarks" 
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        id="city" 
                        placeholder="e.g., Delhi"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input 
                        id="state" 
                        placeholder="e.g., Delhi"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input 
                        id="pincode" 
                        placeholder="e.g., 110001"
                        value={formData.pincode}
                        onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="college">Nearest College/University</Label>
                      <Input 
                        id="college" 
                        placeholder="e.g., Delhi University"
                        value={formData.college}
                        onChange={(e) => setFormData({...formData, college: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance (km)</Label>
                      <Input 
                        id="distance" 
                        type="number" 
                        step="0.1" 
                        placeholder="e.g., 0.5"
                        value={formData.distance}
                        onChange={(e) => setFormData({...formData, distance: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Property Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe your property, nearby facilities, transport options, etc." 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Pricing & Details */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing & Availability
                    </CardTitle>
                    <CardDescription>Set your pricing and room details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rent">Monthly Rent (₹) *</Label>
                        <Input 
                          id="rent" 
                          type="number" 
                          placeholder="e.g., 8500"
                          value={formData.rent}
                          onChange={(e) => setFormData({...formData, rent: e.target.value})}
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="deposit">Security Deposit (₹) *</Label>
                        <Input 
                          id="deposit" 
                          type="number" 
                          placeholder="e.g., 5000"
                          value={formData.deposit}
                          onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="beds">Total Beds</Label>
                        <Input 
                          id="beds" 
                          type="number" 
                          placeholder="e.g., 10"
                          value={formData.totalBeds}
                          onChange={(e) => setFormData({...formData, totalBeds: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="available">Available Beds *</Label>
                        <Input 
                          id="available" 
                          type="number" 
                          placeholder="e.g., 3"
                          value={formData.availableBeds}
                          onChange={(e) => setFormData({...formData, availableBeds: e.target.value})}
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="curfew">Curfew Time (Optional)</Label>
                      <Input 
                        id="curfew" 
                        type="time"
                        value={formData.curfew}
                        onChange={(e) => setFormData({...formData, curfew: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rules">House Rules</Label>
                      <Textarea 
                        id="rules" 
                        placeholder="List any important rules or restrictions" 
                        rows={4}
                        value={formData.rules}
                        onChange={(e) => setFormData({...formData, rules: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenance">Maintenance Charges (₹/month)</Label>
                        <Input 
                          id="maintenance" 
                          type="number" 
                          placeholder="e.g., 500"
                          value={formData.maintenanceCharges}
                          onChange={(e) => setFormData({...formData, maintenanceCharges: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="electricity">Electricity Charges</Label>
                        <Input 
                          id="electricity" 
                          placeholder="e.g., As per usage or Fixed ₹500"
                          value={formData.electricityCharges}
                          onChange={(e) => setFormData({...formData, electricityCharges: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="food"
                        checked={formData.foodIncluded}
                        onCheckedChange={(checked) => setFormData({...formData, foodIncluded: checked})}
                      />
                      <Label htmlFor="food">Food Included in Rent</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Group Link (Optional)</Label>
                      <Input 
                        id="whatsapp" 
                        placeholder="https://chat.whatsapp.com/..."
                        value={formData.whatsappGroup}
                        onChange={(e) => setFormData({...formData, whatsappGroup: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">Add a WhatsApp group for tenant community</p>
                    </div>
                  </CardContent>
                </Card>

                <HiddenChargeDetector 
                  pgData={{
                    description: formData.description,
                    rent: Number(formData.rent),
                    deposit: Number(formData.deposit),
                    amenities: formData.amenities,
                    rules: formData.rules,
                    maintenanceCharges: formData.maintenanceCharges,
                    electricityCharges: formData.electricityCharges,
                    foodIncluded: formData.foodIncluded,
                  }}
                />
              </div>
            )}

            {/* Step 3: Amenities & Rules */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Amenities & Facilities</CardTitle>
                    <CardDescription>Select all available amenities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {amenities.map((amenity) => (
                        <div 
                          key={amenity} 
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.amenities.includes(amenity) 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Checkbox 
                            id={`amenity-${amenity}`}
                            checked={formData.amenities.includes(amenity)}
                            onCheckedChange={() => toggleAmenity(amenity)}
                          />
                          <Label 
                            htmlFor={`amenity-${amenity}`}
                            className="cursor-pointer text-sm flex-1"
                          >
                            {amenity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Property Characteristics</CardTitle>
                    <CardDescription>Help students understand your PG better</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Cleanliness Level</Label>
                        <Badge variant="secondary">{formData.cleanlinessLevel[0]}/5</Badge>
                      </div>
                      <Slider
                        value={formData.cleanlinessLevel}
                        onValueChange={(v) => setFormData(prev => ({...prev, cleanlinessLevel: v}))}
                        min={1}
                        max={5}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Basic</span>
                        <span>Spotless</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Strictness Level</Label>
                        <Badge variant="secondary">{formData.strictnessLevel[0]}/5</Badge>
                      </div>
                      <Slider
                        value={formData.strictnessLevel}
                        onValueChange={(v) => setFormData(prev => ({...prev, strictnessLevel: v}))}
                        min={1}
                        max={5}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Flexible</span>
                        <span>Very Strict</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      AI Description Generator
                    </CardTitle>
                    <CardDescription>Generate a professional description using AI</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description">Property Description</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateDescription}
                          disabled={generatingDescription || !formData.amenities.length || !formData.rent}
                          className="gap-2"
                        >
                          {generatingDescription ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generate with AI
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        placeholder="Describe your PG... or click 'Generate with AI' to create one automatically"
                        rows={6}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Tip: Fill in amenities and rent first, then use AI to generate a professional description
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Photos */}
            {step === 4 && (
              <Card className="border-2 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Upload Photos
                  </CardTitle>
                  <CardDescription>Add at least 3 photos of your property (room, bathroom, common areas)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                    <input 
                      type="file" 
                      id="imageUpload"
                      multiple 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="imageUpload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
                    </label>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden border-2 group">
                          <img 
                            src={img.preview} 
                            alt={`Upload ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadedImages.length === 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                          <div className="text-center">
                            <Image className="h-8 w-8 mx-auto text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground mt-1">Photo {i}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Card className="bg-primary/5 border-primary">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Photo Guidelines</p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                          <li>Include photos of rooms, bathroom, common areas</li>
                          <li>Good lighting helps attract more tenants</li>
                          <li>Avoid photos with people in them</li>
                          <li>Upload at least 3 photos (recommended: 5-10)</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Preview */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Preview Your Listing
                    </CardTitle>
                    <CardDescription>Review all information before publishing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Preview Card */}
                    <div className="border rounded-lg overflow-hidden">
                      {uploadedImages.length > 0 ? (
                        <div className="aspect-video bg-muted relative">
                          <img 
                            src={uploadedImages[0].preview} 
                            alt="Property preview" 
                            className="w-full h-full object-cover"
                          />
                          {uploadedImages.length > 1 && (
                            <Badge className="absolute bottom-2 right-2">{uploadedImages.length} photos</Badge>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <Building2 className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-xl mb-2">{formData.name || "Your PG Name"}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                          <MapPin className="h-4 w-4" />
                          {formData.city && formData.state ? `${formData.city}, ${formData.state}` : "City, State"}
                          {formData.distance && formData.college && ` • ${formData.distance} km from ${formData.college}`}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {formData.amenities.slice(0, 4).map((a) => (
                            <Badge key={a} variant="secondary">{a}</Badge>
                          ))}
                          {formData.amenities.length > 4 && (
                            <Badge variant="outline">+{formData.amenities.length - 4} more</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">
                            ₹{formData.rent || "0"}/mo
                          </span>
                          <Badge>{formData.availableBeds || "0"} beds available</Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Checklist */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Listing Checklist</h4>
                      {[
                        { label: "Basic information completed", done: !!formData.name && !!formData.gender && !!formData.city },
                        { label: "Pricing details added", done: !!formData.rent && !!formData.deposit },
                        { label: "Amenities selected", done: formData.amenities.length > 0 },
                        { label: "Photos uploaded (min 3)", done: uploadedImages.length >= 3 },
                        { label: "Address details complete", done: !!formData.address && !!formData.city && !!formData.state },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {item.done ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={`text-sm ${item.done ? "" : "text-muted-foreground"}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Sentiment Preview */}
                <SentimentSummary 
                  overallSentiment="positive"
                  sentimentScore={0}
                  totalReviews={0}
                  highlights={["New Listing"]}
                  concerns={["No reviews yet"]}
                />

                <Card className="bg-accent/5 border-accent">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Get Verified for More Visibility</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Verified listings get 3x more inquiries. Upload your documents after publishing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1 || submitting}
              >
                Previous
              </Button>
              
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(Math.min(totalSteps, step + 1))}
                  disabled={submitting}
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="accent" 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish Listing
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PostRoom;
