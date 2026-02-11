import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  FileText,
  Download,
  Trash2,
  Search,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import type { Invoice } from "@shared/schema";
import jsPDF from "jspdf";

const TAX_RATE = 0.16;

function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const typeLabel = invoice.type === "invoice" ? "INVOICE" : "QUOTATION";
  const eventDateStr = format(new Date(invoice.eventDate), "dd MMM yyyy");
  const createdDateStr = format(new Date(invoice.createdAt), "dd MMM yyyy");
  const baseAmount = Number(invoice.amount);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(typeLabel, marginLeft, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(invoice.displayNumber, pageWidth - marginRight, 30, { align: "right" });

  let y = 42;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Date:", marginLeft, y);
  doc.text(createdDateStr, pageWidth - marginRight, y, { align: "right" });
  y += 7;
  doc.text("Bill To:", marginLeft, y);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.billTo, pageWidth - marginRight, y, { align: "right" });

  y += 14;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - marginRight, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Description", marginLeft, y);
  doc.text("Amount (Rs)", pageWidth - marginRight, y, { align: "right" });

  y += 3;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(marginLeft, y, pageWidth - marginRight, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const description = `DRUM CIRCLE \u2013 ${invoice.city} \u2013 ${eventDateStr} \u2013 ${invoice.numberOfDrums} DRUMS \u2013 ${invoice.duration}`;
  const descLines = doc.splitTextToSize(description, contentWidth - 40);
  doc.text(descLines, marginLeft, y);
  doc.text(baseAmount.toLocaleString(), pageWidth - marginRight, y, { align: "right" });

  y += descLines.length * 5 + 6;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - marginRight, y);

  if (invoice.taxMode === "inclusive") {
    const preGstAmount = Math.round(baseAmount / (1 + TAX_RATE));
    const gstAmount = baseAmount - preGstAmount;

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text("Amount before GST", marginLeft, y);
    doc.text(preGstAmount.toLocaleString(), pageWidth - marginRight, y, { align: "right" });

    y += 6;
    doc.text(`GST (${Math.round(TAX_RATE * 100)}%)`, marginLeft, y);
    doc.text(gstAmount.toLocaleString(), pageWidth - marginRight, y, { align: "right" });

    y += 3;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, y, pageWidth - marginRight, y);

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Total (Inclusive of GST)", marginLeft, y);
    doc.text(baseAmount.toLocaleString(), pageWidth - marginRight, y, { align: "right" });
  } else {
    const gstAmount = Math.round(baseAmount * TAX_RATE);
    const grandTotal = baseAmount + gstAmount;

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", marginLeft, y);
    doc.text(baseAmount.toLocaleString(), pageWidth - marginRight, y, { align: "right" });

    y += 6;
    doc.text(`GST (${Math.round(TAX_RATE * 100)}%)`, marginLeft, y);
    doc.text(gstAmount.toLocaleString(), pageWidth - marginRight, y, { align: "right" });

    y += 3;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, y, pageWidth - marginRight, y);

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total (Exclusive of GST)", marginLeft, y);
    doc.text(grandTotal.toLocaleString(), pageWidth - marginRight, y, { align: "right" });
  }

  y += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  if (invoice.taxMode === "exclusive") {
    doc.text("All applicable taxes (GST @ 16%) are charged separately as shown above.", marginLeft, y);
  } else {
    doc.text("All applicable taxes (GST @ 16%) are included in the total amount as shown above.", marginLeft, y);
  }

  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Terms & Requirements", marginLeft, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const terms = [
    "The organizer shall provide a minimum of three (x3) microphones with three (x3) large microphone stands, along with one (x1) headset microphone and a functional sound system at the venue.",
    "Armless chairs must be arranged in accordance with the agreed number of drums confirmed prior to the event.",
    "Three to four (3-4) bottles of drinking water (room temperature) are to be made available at the time of performance.",
    "The event date will be confirmed and locked upon receipt of a 50% advance payment, which is non-refundable.",
    "The remaining 50% balance is payable before the commencement of the drum circle.",
    "Drum Circle Pakistan shall not be held liable for any losses arising from unforeseen circumstances beyond its reasonable control.",
    "The organizer is requested to provide two to three (2\u20133) support staff members to assist with loading and unloading drums between the vehicle and the activity area.",
    "In the unlikely event that Drum Circle Pakistan is unable to perform due to internal reasons, any amount paid by the client shall be refunded in full.",
  ];

  for (let i = 0; i < terms.length; i++) {
    const termText = `${i + 1}. ${terms[i]}`;
    const lines = doc.splitTextToSize(termText, contentWidth);
    if (y + lines.length * 4 > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, marginLeft, y);
    y += lines.length * 4 + 3;
  }

  y += 6;
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Please make all payments in the favor of", marginLeft, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const bankDetails = [
    "Account Title: Haider Jamil",
    "Account#: 01728593801",
    "Bank Name: Standard Chartered Bank",
    "IBAN: PK91SCBL0000001728593801",
    "CNIC/NTN: 34603-6653341-7",
  ];
  for (const line of bankDetails) {
    doc.text(line, marginLeft, y);
    y += 4.5;
  }

  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("For details call +923004598500 or email drumcirclepakistan@gmail.com", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text("This document is system-generated and does not require manual authorization or signature.", pageWidth / 2, y, { align: "center" });

  return doc;
}

function downloadInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDF(invoice);
  const fileName = `${invoice.type === "invoice" ? "Invoice" : "Quotation"}_${invoice.billTo.replace(/\s+/g, "_")}_${invoice.city}_${format(new Date(invoice.createdAt), "dd-MMM-yyyy")}_${Date.now()}.pdf`;
  doc.save(fileName);
}

export default function InvoiceGeneratorPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [formType, setFormType] = useState<"invoice" | "quotation">("invoice");
  const [billTo, setBillTo] = useState("");
  const [city, setCity] = useState("");
  const [numberOfDrums, setNumberOfDrums] = useState("");
  const [duration, setDuration] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [amount, setAmount] = useState("");
  const [taxMode, setTaxMode] = useState<"inclusive" | "exclusive">("exclusive");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: invoicesList, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/invoices?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoices", data);
      return res.json();
    },
    onSuccess: (invoice: Invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: `${invoice.type === "invoice" ? "Invoice" : "Quotation"} created`, description: invoice.displayNumber });
      downloadInvoicePDF(invoice);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/invoices/${id}`, data);
      return res.json();
    },
    onSuccess: (invoice: Invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: `${invoice.type === "invoice" ? "Invoice" : "Quotation"} updated`, description: invoice.displayNumber });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Deleted successfully" });
      setDeleteId(null);
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingInvoice(null);
    setFormType("invoice");
    setBillTo("");
    setCity("");
    setNumberOfDrums("");
    setDuration("");
    setEventDate(undefined);
    setAmount("");
    setTaxMode("exclusive");
  }

  function startEdit(inv: Invoice) {
    setEditingInvoice(inv);
    setFormType(inv.type);
    setBillTo(inv.billTo);
    setCity(inv.city);
    setNumberOfDrums(String(inv.numberOfDrums));
    setDuration(inv.duration);
    setEventDate(new Date(inv.eventDate));
    setAmount(String(inv.amount));
    setTaxMode(inv.taxMode);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!billTo || !city || !numberOfDrums || !duration || !eventDate || !amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    const payload = {
      type: formType,
      billTo,
      city,
      numberOfDrums: parseInt(numberOfDrums),
      duration,
      eventDate: eventDate.toISOString(),
      amount: parseInt(amount),
      taxMode,
    };

    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const filtered = useMemo(() => {
    if (!invoicesList) return [];
    if (!search) return invoicesList;
    const q = search.toLowerCase();
    return invoicesList.filter(
      (inv) =>
        inv.billTo.toLowerCase().includes(q) ||
        inv.city.toLowerCase().includes(q) ||
        inv.displayNumber.toLowerCase().includes(q)
    );
  }, [invoicesList, search]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function getTaxDisplay(inv: Invoice) {
    const amt = Number(inv.amount);
    if (inv.taxMode === "inclusive") {
      const preGst = Math.round(amt / (1 + TAX_RATE));
      const gst = amt - preGst;
      return `Rs ${amt.toLocaleString()} (incl. GST Rs ${gst.toLocaleString()})`;
    } else {
      const gst = Math.round(amt * TAX_RATE);
      const total = amt + gst;
      return `Rs ${amt.toLocaleString()} + GST Rs ${gst.toLocaleString()} = Rs ${total.toLocaleString()}`;
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-invoice-page-title">Invoice Generator</h1>
          <p className="text-sm text-muted-foreground">Create and manage invoices & quotations</p>
        </div>
        {!showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="button-create-invoice">
            <Plus className="w-4 h-4 mr-1" />
            Create New
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-semibold">
                {editingInvoice
                  ? `Edit ${editingInvoice.displayNumber}`
                  : `New ${formType === "invoice" ? "Invoice" : "Quotation"}`}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as any)}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="quotation">Quotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Bill To / Client Name</Label>
                <Input
                  value={billTo}
                  onChange={(e) => setBillTo(e.target.value)}
                  placeholder="e.g. Unilever Pakistan"
                  data-testid="input-bill-to"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore"
                  data-testid="input-city"
                />
              </div>
              <div>
                <Label>No. of Drums</Label>
                <Input
                  type="number"
                  value={numberOfDrums}
                  onChange={(e) => setNumberOfDrums(e.target.value)}
                  placeholder="e.g. 60"
                  data-testid="input-drums"
                />
              </div>
              <div>
                <Label>Duration</Label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 45 to 60 Mins"
                  data-testid="input-duration"
                />
              </div>
              <div>
                <Label>Event Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-event-date"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {eventDate ? format(eventDate, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={(d) => { setEventDate(d); setDatePickerOpen(false); }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Amount (Rs)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  data-testid="input-amount"
                />
              </div>
              <div>
                <Label>Tax Mode</Label>
                <Select value={taxMode} onValueChange={(v) => setTaxMode(v as any)}>
                  <SelectTrigger data-testid="select-tax-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Exclusive of GST</SelectItem>
                    <SelectItem value="inclusive">Inclusive of GST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {amount && parseInt(amount) > 0 && (
              <div className="text-xs text-muted-foreground p-2.5 rounded-md bg-muted/50">
                {taxMode === "inclusive" ? (
                  <>
                    <span className="font-medium">Inclusive breakdown:</span>{" "}
                    Amount before GST: Rs {Math.round(parseInt(amount) / (1 + TAX_RATE)).toLocaleString()}{" "}
                    + GST (16%): Rs {(parseInt(amount) - Math.round(parseInt(amount) / (1 + TAX_RATE))).toLocaleString()}{" "}
                    = Total: Rs {parseInt(amount).toLocaleString()}
                  </>
                ) : (
                  <>
                    <span className="font-medium">Exclusive breakdown:</span>{" "}
                    Subtotal: Rs {parseInt(amount).toLocaleString()}{" "}
                    + GST (16%): Rs {Math.round(parseInt(amount) * TAX_RATE).toLocaleString()}{" "}
                    = Grand Total: Rs {(parseInt(amount) + Math.round(parseInt(amount) * TAX_RATE)).toLocaleString()}
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-form">
                Cancel
              </Button>
              {editingInvoice && (
                <Button
                  variant="outline"
                  onClick={() => downloadInvoicePDF({ ...editingInvoice, type: formType, billTo, city, numberOfDrums: parseInt(numberOfDrums) || 0, duration, eventDate: eventDate ? eventDate.toISOString() : editingInvoice.eventDate, amount: parseInt(amount) || 0, taxMode } as Invoice)}
                  data-testid="button-preview-pdf"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Preview PDF
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                data-testid="button-generate"
              >
                <FileText className="w-4 h-4 mr-1" />
                {isPending
                  ? (editingInvoice ? "Saving..." : "Generating...")
                  : editingInvoice
                    ? "Save Changes"
                    : "Generate & Download"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, city, or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              data-testid="input-search-invoices"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-type">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
              <SelectItem value="quotation">Quotations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-empty-state">
                {search ? "No results found" : "No invoices or quotations yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((inv) => (
              <Card key={inv.id} data-testid={`card-invoice-${inv.id}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" data-testid={`text-invoice-number-${inv.id}`}>
                          {inv.displayNumber}
                        </span>
                        <Badge variant={inv.type === "invoice" ? "default" : "secondary"}>
                          {inv.type === "invoice" ? "Invoice" : "Quotation"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {inv.taxMode === "inclusive" ? "GST Inclusive" : "GST Exclusive"}
                        </Badge>
                      </div>
                      <p className="text-sm mt-0.5" data-testid={`text-invoice-client-${inv.id}`}>
                        {inv.billTo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{inv.city}</span>
                        <span className="text-xs text-muted-foreground">
                          Event: {format(new Date(inv.eventDate), "dd MMM yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {inv.numberOfDrums} drums
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-invoice-tax-${inv.id}`}>
                        {getTaxDisplay(inv)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created: {format(new Date(inv.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-sm font-semibold" data-testid={`text-invoice-amount-${inv.id}`}>
                        Rs {Number(inv.amount).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => startEdit(inv)}
                          data-testid={`button-edit-${inv.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadInvoicePDF(inv)}
                          data-testid={`button-download-${inv.id}`}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </Button>
                        <Dialog open={deleteId === inv.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setDeleteId(inv.id)}
                              data-testid={`button-delete-${inv.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Delete {inv.type === "invoice" ? "Invoice" : "Quotation"}?</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground">
                              This will permanently delete {inv.displayNumber} for {inv.billTo}.
                            </p>
                            <DialogFooter className="gap-2">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(inv.id)}
                                disabled={deleteMutation.isPending}
                                data-testid="button-confirm-delete"
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
