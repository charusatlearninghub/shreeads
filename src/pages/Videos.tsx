import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Youtube, Play, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UniversalVideoPlayer } from "@/components/video/UniversalVideoPlayer";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  order_index: number;
}

const Videos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .select("id, title, description, youtube_url, thumbnail_url, order_index")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (!error) setVideos((data as YouTubeVideo[]) || []);
      setIsLoading(false);
    };
    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Marketing Video Tutorials | ShreeAds"
        description="Watch free marketing video tutorials and learn digital marketing from experts. Browse our video library and improve your skills with ShreeAds."
      />
      <Header />
      <main className="pt-24 sm:pt-28 lg:pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 sm:mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Youtube className="w-4 h-4" />
              <span>Video Gallery</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Watch & <span className="gradient-text">Learn</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Explore our curated collection of educational YouTube videos to enhance your skills.
            </p>
          </motion.div>

          {/* Videos Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-16">
              <Youtube className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">No Videos Yet</h2>
              <p className="text-muted-foreground">Check back later for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="relative aspect-video bg-secondary">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Youtube className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 sm:w-7 sm:h-7 text-primary ml-1" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display font-bold text-sm sm:text-base line-clamp-2 mb-1">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Video Player Modal - playback requires login for secure access */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
          {selectedVideo && (
            <div>
              <div className="aspect-video relative bg-black">
                {!user ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <Youtube className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-white font-medium mb-1">Log in to watch</p>
                    <p className="text-white/80 text-sm mb-4 max-w-sm">
                      Sign in to access the video library and play videos.
                    </p>
                    <Button asChild variant="default">
                      <Link to="/login">Log in</Link>
                    </Button>
                  </div>
                ) : (
                  <UniversalVideoPlayer
                    url={selectedVideo.youtube_url}
                    title={selectedVideo.title}
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="p-4 bg-card">
                <h2 className="font-display font-bold text-lg">{selectedVideo.title}</h2>
                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedVideo.description}</p>
                )}
                <a
                  href={selectedVideo?.youtube_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-primary hover:underline"
                >
                  Open source link
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Videos;
