import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { invoice_with_items } from "@/data/collections";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import SEO from "@/components/SEO";

const EditInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice_edit", id],
    queryFn: () => id ? invoice_with_items(id) : null,
    enabled: !!id,
  });

  if (!id) {
    navigate("/invoices");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground mb-4">The invoice you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate("/invoices")}
            className="text-primary hover:underline"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`Edit Invoice ${invoice.invoice_number}`}
        description={`Edit invoice ${invoice.invoice_number} for ${invoice.clients?.name}`}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Invoice</h1>
            <p className="text-muted-foreground">Edit invoice {invoice.invoice_number}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            Back to Invoices
          </Button>
        </div>
        
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Edit Feature Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Invoice editing functionality will be available in a future update.
          </p>
          <p className="text-sm text-muted-foreground">
            For now, you can view and manage this invoice from the invoices list.
          </p>
        </div>
      </div>
    </>
  );
};

export default EditInvoice;