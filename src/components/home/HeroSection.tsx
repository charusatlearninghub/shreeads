import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Play, Sparkles, Users, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartLearning = () => {
    navigate(user ? "/dashboard/courses" : "/login");
  };

  const handleHowToAccess = () => {
    navigate("/videos");
  };

  const handleExploreCourses = () => {
    navigate("/courses");
  };

  const stats = [
    { icon: Users, value: "10,000+", label: "Active Students" },
    { icon: BookOpen, value: "500+", label: "Video Lessons" },
    { icon: Award, value: "50+", label: "Expert Courses" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-[10%] w-20 h-20 rounded-2xl bg-gradient-primary opacity-20 float-animation" style={{ animationDelay: "0s" }} />
      <div className="absolute top-1/3 right-[15%] w-16 h-16 rounded-full bg-gradient-accent opacity-20 float-animation" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-1/4 left-[20%] w-12 h-12 rounded-xl bg-primary/20 float-animation" style={{ animationDelay: "4s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Transform Your Career Today</span>
            </motion.div>

            {/* Heading */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
              Learn Skills That{" "}
              <span className="gradient-text">Drive Success</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              Access premium video courses, track your progress, and earn certificates. 
              Join thousands of learners advancing their careers with SHREE ADS.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2 mt-4 mb-12 w-full max-w-md mx-auto lg:mx-0">
              <Button
                onClick={handleStartLearning}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-95"
              >
                Start Learning Free
              </Button>

              <Button
                onClick={handleHowToAccess}
                variant="secondary"
                className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium shadow hover:opacity-95 active:scale-95 transition"
              >
                How to access the course/software
              </Button>

              <Button
                onClick={handleExploreCourses}
                variant="outline"
                className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Explore Courses
                </span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <span className="font-display text-lg sm:text-2xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="relative bg-card rounded-3xl shadow-2xl overflow-hidden border border-border/50">
                <div className="aspect-[4/3] bg-gradient-primary/10 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <Play className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2">Start Watching</h3>
                    <p className="text-muted-foreground">500+ Video Lessons Available</p>
                  </div>
                </div>
                <div className="p-6 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-gradient-primary border-2 border-card"
                        />
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold">Join 10,000+ Students</p>
                      <p className="text-sm text-muted-foreground">Learning right now</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -left-8 top-1/4 bg-card rounded-2xl shadow-xl p-4 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold">Certificate</p>
                    <p className="text-sm text-muted-foreground">On Completion</p>
                  </div>
                </div>
              </motion.div>

              {/* Progress Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="absolute -right-8 bottom-1/4 bg-card rounded-2xl shadow-xl p-4 border border-border/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Course Progress</p>
                    <p className="text-xs text-muted-foreground">Keep going!</p>
                  </div>
                </div>
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-gradient-primary rounded-full progress-animate" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
