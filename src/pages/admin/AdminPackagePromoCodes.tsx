import { useEffect, useState } from "react";
import { Plus, Loader2, Copy, Trash2, Ticket } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Pkg { id: string; name: string; price: number }
interface PromoRow {
  id: string; code: string; package_id: string; promo_price: number;
  is_used: boolean; used_at: string | null; expires_at: string | null; created_at: string;
  packages?: { name: string };
}

function generateCode(prefix = "PKG"): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${r}`;
}

export default function AdminPackagePromoCodes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<PromoRow[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);

  const [open, setOpen] = useState(false);
  const [pkgId, setPkgId] = useState<string>("");
  const [count, setCount] = useState("1");
  const [promoPrice, setPromoPrice] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [pkgRes, codesRes] = await Promise.all([
      supabase.from("packages").select("id, name, price").order("name"),
      supabase.from("package_promo_codes")
        .select("*, packages(name)")
        .order("created_at", { ascending: false }),
    ]);
    setPackages((pkgRes.data || []) as Pkg[]);
    setCodes((codesRes.data || []) as PromoRow[]);
    setLoading(false);
  }

  async function generate() {
    if (!pkgId) { toast({ title: "Choose a package", variant: "destructive" }); return; }
    const n = Math.max(1, Math.min(100, Number(count) || 1));
    const priceNum = Number(promoPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) { toast({ title: "Invalid price", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const rows = Array.from({ length: n }).map(() => ({
        code: generateCode(),
        package_id: pkgId,
        promo_price: priceNum,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        created_by: u.user?.id,
      }));
      const { error } = await supabase.from("package_promo_codes").insert(rows);
      if (error) throw error;
      toast({ title: `Generated ${n} code${n > 1 ? "s" : ""}` });
      setOpen(false);
      setPkgId(""); setCount("1"); setPromoPrice(""); setExpiresAt("");
      void load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function deleteCode(id: string) {
    const { error } = await supabase.from("package_promo_codes").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Code deleted" }); void load(); }
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: code });
  }

  return (
    <AdminLayout
      title="Package Promo Codes"
      subtitle="Generate one-time codes that unlock a package"
      actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Generate Codes</Button>}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : codes.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">No codes yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Generate your first batch of package codes.</p>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Generate</Button>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.code}</TableCell>
                  <TableCell>{c.packages?.name || "—"}</TableCell>
                  <TableCell>₹{Number(c.promo_price).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    {c.is_used
                      ? <Badge variant="secondary">Used</Badge>
                      : c.expires_at && new Date(c.expires_at) < new Date()
                        ? <Badge variant="destructive">Expired</Badge>
                        : <Badge variant="default">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.expires_at ? format(new Date(c.expires_at), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => copy(c.code)}><Copy className="w-3.5 h-3.5" /></Button>
                    {!c.is_used && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCode(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Package Codes</DialogTitle>
            <DialogDescription>One-time codes a student can redeem to unlock the entire package.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Package *</Label>
              <Select value={pkgId} onValueChange={(v) => {
                setPkgId(v);
                const p = packages.find(x => x.id === v);
                if (p && !promoPrice) setPromoPrice(String(p.price));
              }}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {packages.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" min="1" max="100" value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
              <div>
                <Label>Promo Price (₹) *</Label>
                <Input type="number" min="0" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Expires (optional)</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={generate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
