import { motion } from "framer-motion";
import { 
  Shield, 
  Video, 
  Award, 
  Users, 
  BarChart3, 
  Smartphone,
  Lock,
  Clock
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "HD Video Courses",
    description: "High-quality video lessons with structured curriculum and easy navigation.",
    color: "primary",
  },
  {
    icon: Shield,
    title: "Secure Access",
    description: "One-time promo code enrollment with single-device restriction for content protection.",
    color: "info",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Mandatory progress tracking with resume functionality and completion status.",
    color: "success",
  },
  {
    icon: Award,
    title: "Certificates",
    description: "Download verified certificates upon completing courses to showcase your skills.",
    color: "warning",
  },
  {
    icon: Users,
    title: "Referral Rewards",
    description: "Share your referral code and earn rewards when friends join the platform.",
    color: "accent",
  },
  {
    icon: Lock,
    title: "Content Protection",
    description: "Dynamic watermarking and secure video playback to protect course content.",
    color: "destructive",
  },
  {
    icon: Smartphone,
    title: "Device Management",
    description: "Secure single-device access with admin override for flexibility.",
    color: "primary",
  },
  {
    icon: Clock,
    title: "Lifetime Access",
    description: "Once enrolled, access your courses anytime with no expiration limits.",
    color: "info",
  },
];

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
};

export const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-gradient-surface relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Platform Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="gradient-text">Learn & Grow</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform is designed with the latest technology to provide a seamless learning experience with robust security features.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl ${colorMap[feature.color]} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
