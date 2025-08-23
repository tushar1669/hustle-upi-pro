import SEO from "@/components/SEO";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { invoice_with_items } from "@/data/collections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Lightweight redirector:
 * - Loads the full invoice (header + items)
 * - Immediately routes to /invoices/new with { prefillInvoice } in location.state
 * - Shows a tiny loading/guard UI while doing so
 */
export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: fullInvoice, isLoading, isError } = useQuery({
    queryKey: ["invoice_edit_prefill", id],
    queryFn: () => (id ? invoice_with_items(id) : Promise.resolve(null)),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) {
      navigate("/invoices", { replace: true });
      return;
    }
    if (fullInvoice) {
      navigate("/invoices/new", {
        replace: true,
        state: { prefillInvoice: fullInvoice, fromEditId: id },
      });
    }
  }, [id, fullInvoice, navigate]);

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          This invoice doesn’t exist.{" "}
          <button className="text-primary underline" onClick={() => navigate("/invoices")}>
            Back to Invoices
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <SEO title="Edit Invoice" />
      <Card>
        <CardHeader>
          <CardTitle>Loading invoice…</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Preparing edit view and redirecting…
        </CardContent>
      </Card>
    </>
  );
}
