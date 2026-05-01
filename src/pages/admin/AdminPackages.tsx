import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Pencil, Trash2, Package as PackageIcon, Power, PowerOff } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Pkg {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  affiliate_commission_percent: number;
  created_at: string;
}

interface Course { id: string; title: string }
interface Software { id: string; title: string }
interface PkgItem { package_id: string; item_type: "course" | "software"; item_id: string }

export default function AdminPackages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [items, setItems] = useState<PkgItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);

  // dialog state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [commission, setCommission] = useState("0");
  const [active, setActive] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [selectedSoftware, setSelectedSoftware] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [pkgRes, itemsRes, courseRes, swRes] = await Promise.all([
      supabase.from("packages").select("*").order("created_at", { ascending: false }),
      supabase.from("package_items").select("package_id, item_type, item_id"),
      supabase.from("courses").select("id, title").order("title"),
      supabase.from("software_products").select("id, title").order("title"),
    ]);
    if (pkgRes.error) toast({ title: "Failed to load packages", description: pkgRes.error.message, variant: "destructive" });
    setPackages((pkgRes.data || []) as Pkg[]);
    setItems((itemsRes.data || []) as PkgItem[]);
    setCourses(courseRes.data || []);
    setSoftware(swRes.data || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setThumbnail("");
    setCommission("0");
    setActive(true);
    setSelectedCourses(new Set());
    setSelectedSoftware(new Set());
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(p: Pkg) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(String(p.price));
    setOriginalPrice(String(p.original_price));
    setThumbnail(p.thumbnail_url || "");
    setCommission(String(p.affiliate_commission_percent));
    setActive(p.is_active);
    setSelectedCourses(new Set(items.filter(i => i.package_id === p.id && i.item_type === "course").map(i => i.item_id)));
    setSelectedSoftware(new Set(items.filter(i => i.package_id === p.id && i.item_type === "software").map(i => i.item_id)));
    setOpen(true);
  }

  function toggle(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  }

  async function save() {
    if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    const priceNum = Number(price);
    const origNum = Number(originalPrice);
    const commNum = Number(commission);
    if (Number.isNaN(priceNum) || priceNum < 0) { toast({ title: "Invalid price", variant: "destructive" }); return; }
    if (Number.isNaN(origNum) || origNum < 0) { toast({ title: "Invalid original price", variant: "destructive" }); return; }
    if (Number.isNaN(commNum) || commNum < 0 || commNum > 100) { toast({ title: "Commission must be 0-100", variant: "destructive" }); return; }
    if (selectedCourses.size + selectedSoftware.size === 0) {
      toast({ title: "Select at least one course or software", variant: "destructive" }); return;
    }

    setSaving(true);
    try {
      let pkgId = editingId;
      if (editingId) {
        const { error } = await supabase.from("packages").update({
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          original_price: origNum,
          thumbnail_url: thumbnail.trim() || null,
          affiliate_commission_percent: commNum,
          is_active: active,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("packages").insert({
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          original_price: origNum,
          thumbnail_url: thumbnail.trim() || null,
          affiliate_commission_percent: commNum,
          is_active: active,
          created_by: u.user?.id,
        }).select("id").single();
        if (error) throw error;
        pkgId = data.id;
      }

      // Replace items
      if (pkgId) {
        await supabase.from("package_items").delete().eq("package_id", pkgId);
        const rows = [
          ...Array.from(selectedCourses).map(item_id => ({ package_id: pkgId!, item_type: "course" as const, item_id })),
          ...Array.from(selectedSoftware).map(item_id => ({ package_id: pkgId!, item_type: "software" as const, item_id })),
        ];
        if (rows.length) {
          const { error: iErr } = await supabase.from("package_items").insert(rows);
          if (iErr) throw iErr;
        }
      }

      toast({ title: editingId ? "Package updated" : "Package created" });
      setOpen(false);
      resetForm();
      void loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Pkg) {
    const { error } = await supabase.from("packages").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: !p.is_active ? "Activated" : "Deactivated" }); void loadAll(); }
  }

  async function doDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("packages").delete().eq("id", deleteId);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else toast({ title: "Package deleted" });
    setDeleteId(null);
    void loadAll();
  }

  function countFor(pkg: Pkg, t: "course" | "software") {
    return items.filter(i => i.package_id === pkg.id && i.item_type === t).length;
  }

  return (
    <AdminLayout
      title="Packages & Bundles"
      subtitle="Create learning bundles combining courses and software"
      actions={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Package</Button>}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : packages.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-1">No packages yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first bundle to start cross-selling courses and software.</p>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Create Package</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="overflow-hidden">
                {p.thumbnail_url ? (
                  <div className="aspect-video bg-secondary overflow-hidden">
                    <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <PackageIcon className="w-10 h-10 text-primary/60" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold leading-tight">{p.name}</h3>
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{countFor(p, "course")} courses</Badge>
                    <Badge variant="outline">{countFor(p, "software")} software</Badge>
                    <Badge variant="outline">{p.affiliate_commission_percent}% commission</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">₹{Number(p.price).toLocaleString("en-IN")}</span>
                    {Number(p.original_price) > Number(p.price) && (
                      <span className="text-sm text-muted-foreground line-through">₹{Number(p.original_price).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>
                      {p.is_active ? <PowerOff className="w-3.5 h-3.5 mr-1" /> : <Power className="w-3.5 h-3.5 mr-1" />}
                      {p.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Package" : "Create Package"}</DialogTitle>
            <DialogDescription>Bundle multiple courses and software products at a discounted price.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Package Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pro Marketing Package" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included…" rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Package Price (₹) *</Label>
                <Input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <Label>Original Price (₹) *</Label>
                <Input type="number" min="0" step="1" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
              </div>
              <div>
                <Label>Affiliate Commission (%)</Label>
                <Input type="number" min="0" max="100" step="1" value={commission} onChange={(e) => setCommission(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://…" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="active" checked={active} onCheckedChange={(v) => setActive(Boolean(v))} />
              <Label htmlFor="active" className="cursor-pointer">Active (visible to students)</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Courses ({selectedCourses.size} selected)</Label>
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                  {courses.length === 0 && <p className="text-xs text-muted-foreground p-2">No courses available.</p>}
                  {courses.map(c => (
                    <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <Checkbox checked={selectedCourses.has(c.id)} onCheckedChange={() => toggle(selectedCourses, c.id, setSelectedCourses)} />
                      <span className="truncate">{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Software ({selectedSoftware.size} selected)</Label>
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                  {software.length === 0 && <p className="text-xs text-muted-foreground p-2">No software available.</p>}
                  {software.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <Checkbox checked={selectedSoftware.has(s.id)} onCheckedChange={() => toggle(selectedSoftware, s.id, setSelectedSoftware)} />
                      <span className="truncate">{s.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this package?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the package and its item links. Existing student purchases are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
