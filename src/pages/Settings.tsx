import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon } from "lucide-react";
import { CACHE_KEYS } from "@/hooks/useCache";

interface Settings {
  id?: number;
  creator_display_name?: string;
  company_name?: string;
  gstin?: string;
  company_address?: string;
  footer_message?: string;
  default_gst_percent?: number;
  invoice_prefix?: string;
  logo_url?: string;
  owner_id?: string;
  upi_vpa?: string;
  celebration_enabled?: boolean;
}

export default function Settings() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: CACHE_KEYS.SETTINGS,
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
      
      return data as Settings || {};
    },
  });

  useEffect(() => {
    if (settings?.logo_url) {
      setLogoPreview(settings.logo_url);
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (values: Partial<Settings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let logoUrl = values.logo_url;

      // Handle logo upload if there's a new file
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo_${user.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('business_assets')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('business_assets')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      const updateData = { 
        creator_display_name: values.creator_display_name,
        company_name: values.company_name,
        gstin: values.gstin,
        company_address: values.company_address,
        footer_message: values.footer_message,
        invoice_prefix: values.invoice_prefix,
        default_gst_percent: values.default_gst_percent,
        upi_vpa: values.upi_vpa,
        logo_url: logoUrl 
      };

      if (settings?.id) {
        const { data, error } = await supabase
          .from('settings')
          .update(updateData)
          .eq('id', settings.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert([updateData])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SETTINGS });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      setLogoFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const values: Partial<Settings> = {
      creator_display_name: formData.get('creator_display_name') as string || '',
      company_name: formData.get('company_name') as string || '',
      gstin: formData.get('gstin') as string || '',
      company_address: formData.get('company_address') as string || '',
      footer_message: formData.get('footer_message') as string || '',
      upi_vpa: formData.get('upi_vpa') as string || '',
      invoice_prefix: formData.get('invoice_prefix') as string || '',
      default_gst_percent: Number(formData.get('default_gst_percent')) || 18,
      celebration_enabled: formData.get('celebration_enabled') === 'on',
    };

    updateSettings.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your business information and preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="settings-form">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Your business details that appear on invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="creator_display_name">Business Name</Label>
                <Input
                  id="creator_display_name"
                  name="creator_display_name"
                  defaultValue={settings?.creator_display_name || ''}
                  placeholder="Your Business Name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={settings?.company_name || settings?.creator_display_name || ''}
                  placeholder="Official Company Name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  name="gstin"
                  defaultValue={settings?.gstin || ''}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="company_address">Company Address</Label>
                <Input
                  id="company_address"
                  name="company_address"
                  defaultValue={settings?.company_address || ''}
                  placeholder="123 Business Street, City, State, PIN"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="footer_message">Footer Message</Label>
                <Input
                  id="footer_message"
                  name="footer_message"
                  defaultValue={settings?.footer_message || ''}
                  placeholder="Thank you for your business!"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                <Input
                  id="invoice_prefix"
                  name="invoice_prefix"
                  defaultValue={settings?.invoice_prefix || ''}
                  placeholder="HH"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="default_gst_percent">Default GST %</Label>
                <Input
                  id="default_gst_percent"
                  name="default_gst_percent"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={settings?.default_gst_percent || 18}
                  placeholder="18"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="upi_vpa">UPI ID</Label>
                <Input
                  id="upi_vpa"
                  name="upi_vpa"
                  defaultValue={settings?.upi_vpa || ''}
                  placeholder="yourname@paytm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how your business appears in HustleHub.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="logo">Business Logo</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a PNG or JPG file (max 2MB)
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="w-16 h-16 border rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  {!logoPreview && (
                    <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="celebration_enabled">Celebrate successes</Label>
                  <p className="text-xs text-muted-foreground">
                    Show animations when completing actions
                  </p>
                </div>
                <Switch
                  id="celebration_enabled"
                  name="celebration_enabled"
                  defaultChecked={settings?.celebration_enabled !== false}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              variant="gradient"
              disabled={updateSettings.isPending}
              className="min-w-[120px]"
              data-testid="btn-save-settings"
            >
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}