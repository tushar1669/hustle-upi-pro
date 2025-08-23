import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
  // ... all your imports remain the same ...

// Keep currency helper and component as-is ...

export default function InvoicesList() {
  // ... all hooks and helper functions as-is ...

  return (
    <div className="space-y-6">
      <SEO
        title="HustleHub — Invoices"
        description="Manage all your invoices with filtering and search capabilities."
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Button onClick={() => navigate("/invoices/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList>
                {/* Tabs remain unchanged */}
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>

              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <TabsContent value={activeTab} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice: any) => {
                    const daysOverdue = getDaysOverdue(
                      invoice.due_date,
                      invoice.status
                    );

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{clientName(invoice.client_id)}</TableCell>
                        <TableCell className="text-right">
                          {currency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {daysOverdue > 0 && invoice.status !== "paid" ? (
                            <Badge
                              variant="destructive"
                              className="text-xs"
                            >
                              {daysOverdue}d overdue
                            </Badge>
                          ) : invoice.status === "paid" ? (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              Paid
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {Math.abs(daysOverdue)}d left
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                data-testid="invoice-menu-preview"
                                onClick={() => {
                                  setSelectedPreviewInvoice(invoice);
                                  setShowPreviewModal(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </DropdownMenuItem>

                              {invoice.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaidDate(
                                      new Date().toISOString().split("T")[0]
                                    );
                                    setShowMarkPaidModal(true);
                                  }}
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}

                              {(invoice.status === "sent" ||
                                invoice.status === "overdue") && (
                                <DropdownMenuItem
                                  onClick={() => handleSendReminder(invoice)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Send Reminder
                                </DropdownMenuItem>
                              )}

                              {invoice.status === "draft" && (
                                <DropdownMenuItem
                                  data-testid="invoice-menu-edit"
                                  onClick={() =>
                                    navigate(`/invoices/edit/${invoice.id}`)
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}

                              {invoice.status === "draft" && (
                                <DropdownMenuItem>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Invoice
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mark as Paid Modal */}
      {/* ... keep modal as-is ... */}

      {/* Invoice Preview Modal */}
      {selectedPreviewInvoice && (
        <InvoicePreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedPreviewInvoice(null);
          }}
          invoice={selectedPreviewInvoice}
        />
      )}
    </div>
  );
}
