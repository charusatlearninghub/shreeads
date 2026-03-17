import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Loader2, Youtube, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getYouTubeVideoId, isValidYouTubeUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  video_id: string;
  thumbnail_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

const AdminVideos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtube_url: "",
    is_published: true,
  });
  const [urlError, setUrlError] = useState("");

  const fetchVideos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("youtube_videos")
      .select("*")
      .order("order_index", { ascending: true });

    if (!error) setVideos((data as YouTubeVideo[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const resetForm = () => {
    setFormData({ title: "", description: "", youtube_url: "", is_published: true });
    setUrlError("");
    setEditingVideo(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (video: YouTubeVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      youtube_url: video.youtube_url,
      is_published: video.is_published,
    });
    setUrlError("");
    setShowDialog(true);
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, youtube_url: url }));
    if (url.trim() && !isValidYouTubeUrl(url)) {
      setUrlError("Invalid YouTube URL");
    } else {
      setUrlError("");
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    const videoId = getYouTubeVideoId(formData.youtube_url);
    if (!videoId) {
      toast({ title: "Error", description: "Valid YouTube URL is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const thumbnail = getYouTubeThumbnailUrl(formData.youtube_url, "high");

    if (editingVideo) {
      const { error } = await supabase
        .from("youtube_videos")
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          youtube_url: formData.youtube_url.trim(),
          video_id: videoId,
          thumbnail_url: thumbnail,
          is_published: formData.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingVideo.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update video", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Video updated" });
      }
    } else {
      const maxOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.order_index)) + 1 : 0;
      const { error } = await supabase.from("youtube_videos").insert({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        youtube_url: formData.youtube_url.trim(),
        video_id: videoId,
        thumbnail_url: thumbnail,
        is_published: formData.is_published,
        order_index: maxOrder,
        created_by: user?.id,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to add video", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Video added" });
      }
    }

    setIsSaving(false);
    setShowDialog(false);
    resetForm();
    fetchVideos();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("youtube_videos").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete video", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Video removed" });
      fetchVideos();
    }
  };

  const handleTogglePublish = async (video: YouTubeVideo) => {
    const { error } = await supabase
      .from("youtube_videos")
      .update({ is_published: !video.is_published })
      .eq("id", video.id);

    if (!error) fetchVideos();
  };

  const moveVideo = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= videos.length) return;

    const a = videos[index];
    const b = videos[newIndex];

    await Promise.all([
      supabase.from("youtube_videos").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("youtube_videos").update({ order_index: a.order_index }).eq("id", b.id),
    ]);

    fetchVideos();
  };

  const previewVideoId = getYouTubeVideoId(formData.youtube_url);

  return (
    <AdminLayout
      title="YouTube Videos"
      subtitle="Manage videos displayed on the website"
      actions={
        <Button onClick={openAddDialog} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Video
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <Card className="p-8 text-center">
          <Youtube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display font-bold text-lg mb-2">No Videos Yet</h3>
          <p className="text-muted-foreground mb-4">Add YouTube videos to display on your website</p>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Video
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-48 aspect-video sm:aspect-auto shrink-0">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center min-h-[100px]">
                          <Youtube className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {!video.is_published && (
                        <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                          Draft
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{video.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">ID: {video.video_id}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        <Button variant="ghost" size="icon" onClick={() => moveVideo(index, "up")} disabled={index === 0} title="Move up">
                          <GripVertical className="w-4 h-4 rotate-180" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveVideo(index, "down")} disabled={index === videos.length - 1} title="Move down">
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(video)} title={video.is_published ? "Unpublish" : "Publish"}>
                          {video.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(video)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Video</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{video.title}"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(video.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowDialog(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Video" : "Add YouTube Video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>YouTube URL *</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtube_url}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              {urlError && <p className="text-sm text-destructive">{urlError}</p>}
            </div>

            {previewVideoId && (
              <div className="rounded-lg overflow-hidden border">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${previewVideoId}`}
                    className="w-full h-full"
                    allowFullScreen
                    title="Preview"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Video title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_published: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingVideo ? "Update" : "Add Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVideos;
