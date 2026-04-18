import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Save, Trash2, FileImage, FileDown, Type } from "lucide-react";
import { toast } from "sonner";

type FieldKey = "student_name" | "course_name" | "completion_date" | "certificate_id" | "organization_name";

interface FieldPos {
  x: number; y: number; fontSize: number; color: string; fontFamily: string; align?: "left" | "center" | "right";
}

const FIELD_LABELS: Record<FieldKey, string> = {
  student_name: "Student Name",
  course_name: "Course Name",
  completion_date: "Completion Date",
  certificate_id: "Certificate ID",
  organization_name: "Organization Name",
};

const SAMPLE_VALUES: Record<FieldKey, string> = {
  student_name: "Ved Maniya",
  course_name: "Digital Marketing & Meta Ads",
  completion_date: "April 12, 2026",
  certificate_id: "CERT-2026-DF389F9B",
  organization_name: "SHREE ADS LEARNx",
};

const BUILTIN_FONTS = ["Helvetica", "HelveticaBold", "TimesRoman", "TimesRomanBold", "Courier", "CourierBold"];

const DEFAULT_POSITIONS: Record<FieldKey, FieldPos> = {
  student_name: { x: 50, y: 45, fontSize: 36, color: "#1a1a1a", fontFamily: "HelveticaBold", align: "center" },
  course_name: { x: 50, y: 58, fontSize: 24, color: "#1a1a1a", fontFamily: "Helvetica", align: "center" },
  completion_date: { x: 30, y: 80, fontSize: 16, color: "#444444", fontFamily: "Helvetica", align: "center" },
  certificate_id: { x: 70, y: 80, fontSize: 14, color: "#666666", fontFamily: "Courier", align: "center" },
  organization_name: { x: 50, y: 90, fontSize: 18, color: "#1a1a1a", fontFamily: "Helvetica", align: "center" },
};

const AdminCertificateTemplates = () => {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("__global__");
  const [templateUrl, setTemplateUrl] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("SHREE ADS LEARNx");
  const [positions, setPositions] = useState<Record<FieldKey, FieldPos>>(DEFAULT_POSITIONS);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [previewing, setPreviewing] = useState(false);
  const [uploadingFont, setUploadingFont] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-for-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificate_templates").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: customFonts, refetch: refetchFonts } = useQuery({
    queryKey: ["certificate-fonts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificate_fonts").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const allFonts = useMemo(() => [
    ...BUILTIN_FONTS.map((name) => ({ name, isCustom: false })),
    ...(customFonts || []).map((f) => ({ name: f.name, isCustom: true })),
  ], [customFonts]);

  // Inject @font-face for custom fonts so live preview matches PDF
  useEffect(() => {
    if (!customFonts) return;
    const styleId = "cert-custom-fonts";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = customFonts.map(
      (f) => `@font-face { font-family: "${f.name}"; src: url("${f.font_url}") format("truetype"); font-display: swap; }`,
    ).join("\n");
  }, [customFonts]);

  // Load selected template into form
  useEffect(() => {
    if (!templates) return;
    const courseId = selectedCourseId === "__global__" ? null : selectedCourseId;
    const tmpl = templates.find((t) => t.course_id === courseId);
    if (tmpl) {
      setTemplateUrl(tmpl.template_url);
      setOrganizationName(tmpl.organization_name);
      setPositions({ ...DEFAULT_POSITIONS, ...(tmpl.field_positions as unknown as Record<FieldKey, FieldPos>) });
    } else {
      setTemplateUrl("");
      setOrganizationName("SHREE ADS LEARNx");
      setPositions(DEFAULT_POSITIONS);
    }
  }, [selectedCourseId, templates]);

  // Track preview container size for instant overlay updates
  useEffect(() => {
    if (!previewRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setPreviewSize({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(previewRef.current);
    return () => obs.disconnect();
  }, [templateUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a PNG or JPG image");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${selectedCourseId === "__global__" ? "global" : selectedCourseId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("certificate-templates").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("certificate-templates").getPublicUrl(path);
      setTemplateUrl(data.publicUrl);
      toast.success("Template uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!templateUrl) {
      toast.error("Please upload a template image first");
      return;
    }
    setSaving(true);
    try {
      const courseId = selectedCourseId === "__global__" ? null : selectedCourseId;
      const existing = templates?.find((t) => t.course_id === courseId);
      const payload = {
        course_id: courseId,
        template_url: templateUrl,
        organization_name: organizationName,
        field_positions: positions as any,
        is_active: true,
      };
      const { error } = existing
        ? await supabase.from("certificate_templates").update(payload).eq("id", existing.id)
        : await supabase.from("certificate_templates").insert(payload);
      if (error) throw error;
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const courseId = selectedCourseId === "__global__" ? null : selectedCourseId;
    const existing = templates?.find((t) => t.course_id === courseId);
    if (!existing) return;
    if (!confirm("Delete this template?")) return;
    const { error } = await supabase.from("certificate_templates").delete().eq("id", existing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Template deleted");
    queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
  };

  const updatePos = (field: FieldKey, key: keyof FieldPos, value: any) => {
    setPositions((p) => ({ ...p, [field]: { ...p[field], [key]: value } }));
  };

  const fontFamilyToCss = (f: string) => {
    if (BUILTIN_FONTS.includes(f)) {
      if (f.startsWith("Times")) return "'Times New Roman', serif";
      if (f.startsWith("Courier")) return "'Courier New', monospace";
      return "Arial, Helvetica, sans-serif";
    }
    // Custom font: use the registered @font-face name
    return `"${f}", Arial, sans-serif`;
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".ttf") && !lower.endsWith(".otf")) {
      toast.error("Please upload a TTF or OTF font file");
      return;
    }
    const fontName = lower.replace(/\.(ttf|otf)$/, "").replace(/[^a-z0-9-]/gi, "-");
    setUploadingFont(true);
    try {
      const path = `${Date.now()}-${fontName}.${lower.endsWith(".otf") ? "otf" : "ttf"}`;
      const { error: upErr } = await supabase.storage.from("certificate-fonts").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("certificate-fonts").getPublicUrl(path);
      const { error: insErr } = await supabase.from("certificate_fonts").insert({ name: fontName, font_url: data.publicUrl });
      if (insErr) throw insErr;
      toast.success(`Font "${fontName}" uploaded`);
      refetchFonts();
    } catch (err: any) {
      toast.error(err.message || "Font upload failed");
    } finally {
      setUploadingFont(false);
      if (fontInputRef.current) fontInputRef.current.value = "";
    }
  };

  const handleDeleteFont = async (id: string, name: string) => {
    if (!confirm(`Delete font "${name}"? Templates using this font will fall back to Helvetica.`)) return;
    const { error } = await supabase.from("certificate_fonts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Font deleted");
    refetchFonts();
  };

  const handlePreviewPdf = async () => {
    if (!templateUrl) {
      toast.error("Upload a template image first");
      return;
    }
    setPreviewing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/preview-certificate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ template_url: templateUrl, organization_name: organizationName, field_positions: positions }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Preview failed" }));
        throw new Error(err.error || "Preview failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("Preview PDF opened");
    } catch (err: any) {
      toast.error(err.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <AdminLayout title="Certificate Templates" subtitle="Upload custom certificate designs and configure dynamic field positions">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Choose Global Default or a specific course override. Courses without a custom template use the Global Default.
            </Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__global__">🌐 Global Default Template</SelectItem>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Template Image (PNG / JPG)</Label>
                  <div className="flex gap-2 mt-1">
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleUpload} className="hidden" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : templateUrl ? "Replace Template" : "Upload Template"}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Organization Name</Label>
                  <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="mt-1" />
                </div>

                <Tabs defaultValue="student_name" className="w-full">
                  <TabsList className="grid grid-cols-5 h-auto">
                    {(Object.keys(FIELD_LABELS) as FieldKey[]).map((k) => (
                      <TabsTrigger key={k} value={k} className="text-[10px] px-1 py-1.5">{FIELD_LABELS[k].split(" ")[0]}</TabsTrigger>
                    ))}
                  </TabsList>
                  {(Object.keys(FIELD_LABELS) as FieldKey[]).map((field) => (
                    <TabsContent key={field} value={field} className="space-y-3 pt-3">
                      <p className="text-sm font-medium">{FIELD_LABELS[field]} <code className="text-xs text-muted-foreground ml-2">{`{{${field}}}`}</code></p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">X (% from left)</Label>
                          <Input type="number" min={0} max={100} value={positions[field].x} onChange={(e) => updatePos(field, "x", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">Y (% from top)</Label>
                          <Input type="number" min={0} max={100} value={positions[field].y} onChange={(e) => updatePos(field, "y", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">Font Size (pt)</Label>
                          <Input type="number" min={6} max={200} value={positions[field].fontSize} onChange={(e) => updatePos(field, "fontSize", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">Color</Label>
                          <Input type="color" value={positions[field].color} onChange={(e) => updatePos(field, "color", e.target.value)} className="h-10 p-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Font Family</Label>
                          <Select value={positions[field].fontFamily} onValueChange={(v) => updatePos(field, "fontFamily", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {allFonts.map((f) => (
                                <SelectItem key={f.name} value={f.name}>
                                  {f.name}{f.isCustom && " (custom)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Alignment</Label>
                          <Select value={positions[field].align || "center"} onValueChange={(v) => updatePos(field, "align", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Template"}
                  </Button>
                  <Button onClick={handlePreviewPdf} disabled={previewing || !templateUrl} variant="secondary" className="flex-1">
                    <FileDown className="w-4 h-4 mr-2" />{previewing ? "Generating..." : "Preview PDF"}
                  </Button>
                  {templates?.find((t) => t.course_id === (selectedCourseId === "__global__" ? null : selectedCourseId)) && (
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right: Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {templateUrl ? (
                  <div ref={previewRef} className="relative w-full border rounded-md overflow-hidden bg-muted">
                    <img src={templateUrl} alt="Certificate template" className="w-full h-auto block" />
                    {(Object.keys(FIELD_LABELS) as FieldKey[]).map((field) => {
                      const pos = positions[field];
                      // Scale font size: assume template renders at preview width; use ratio of preview width to a 1000px reference
                      const scaledFontSize = (pos.fontSize / 1000) * previewSize.width;
                      return (
                        <div
                          key={field}
                          className="absolute pointer-events-none whitespace-nowrap"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: pos.align === "left" ? "translate(0, -50%)" : pos.align === "right" ? "translate(-100%, -50%)" : "translate(-50%, -50%)",
                            fontSize: `${scaledFontSize}px`,
                            color: pos.color,
                            fontFamily: fontFamilyToCss(pos.fontFamily),
                            fontWeight: pos.fontFamily.includes("Bold") ? "bold" : "normal",
                            lineHeight: 1,
                          }}
                        >
                          {SAMPLE_VALUES[field]}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-md p-12 text-center text-muted-foreground">
                    <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Upload a template image to see live preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Custom Fonts Library */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Type className="w-5 h-5" /> Custom Fonts Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Upload TTF or OTF font files to use them in any certificate template. Uploaded fonts appear in the Font Family dropdown above.
            </p>
            <input ref={fontInputRef} type="file" accept=".ttf,.otf,font/ttf,font/otf" onChange={handleFontUpload} className="hidden" />
            <Button variant="outline" onClick={() => fontInputRef.current?.click()} disabled={uploadingFont}>
              <Upload className="w-4 h-4 mr-2" />
              {uploadingFont ? "Uploading..." : "Upload Font (TTF / OTF)"}
            </Button>
            {customFonts && customFonts.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {customFonts.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 p-3 border rounded-md">
                    <span className="text-sm truncate" style={{ fontFamily: `"${f.name}", sans-serif` }}>{f.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteFont(f.id, f.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No custom fonts uploaded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCertificateTemplates;
