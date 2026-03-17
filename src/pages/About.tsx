import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Target, Eye, Heart, Users, Award, BookOpen, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/new-logo.png";
const values = [{
  icon: Target,
  title: "Our Mission",
  description: "To empower individuals with quality education and practical skills that drive real-world success in the digital economy."
}, {
  icon: Eye,
  title: "Our Vision",
  description: "To become India's most trusted learning platform, making premium education accessible to everyone, everywhere."
}, {
  icon: Heart,
  title: "Our Values",
  description: "Integrity, excellence, innovation, and student success are at the heart of everything we do."
}];
const features = [{
  icon: BookOpen,
  title: "Expert-Led Courses",
  description: "Learn from industry professionals with years of real-world experience."
}, {
  icon: Award,
  title: "Verified Certificates",
  description: "Earn recognized certificates that showcase your skills to employers."
}, {
  icon: Users,
  title: "Community Support",
  description: "Join a thriving community of learners and grow together."
}, {
  icon: Zap,
  title: "Practical Learning",
  description: "Hands-on projects and real-world applications for better understanding."
}, {
  icon: Shield,
  title: "Secure Platform",
  description: "Your data and learning progress are protected with enterprise-grade security."
}, {
  icon: TrendingUp,
  title: "Career Growth",
  description: "Skills that directly translate to better job opportunities and career advancement."
}];
const stats = [{
  value: "1000+",
  label: "Happy Students"
}, {
  value: "50+",
  label: "Expert Courses"
}, {
  value: "95%",
  label: "Success Rate"
}, {
  value: "24/7",
  label: "Support"
}];
const About = () => {
  return <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="text-center max-w-4xl mx-auto">
              <motion.div initial={{
              scale: 0.8,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} transition={{
              duration: 0.5
            }} className="flex justify-center mb-8">
                <img alt="SHREE ADS" className="h-24 sm:h-32 w-auto object-contain" src={logo} />
              </motion.div>
              
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
                About{" "}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-orange-500 bg-clip-text text-transparent">
                  SHREE ADS
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                SHREE ADS is a premier online learning platform dedicated to transforming 
                lives through quality education. We believe that everyone deserves access to 
                world-class learning resources that can help them achieve their dreams.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 lg:py-24 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Our Story
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
                  The ShreeAds Journey
                </h2>
              </motion.div>
              
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }} className="bg-card rounded-2xl p-8 shadow-lg border border-border">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    <strong className="text-foreground">SHREE ADS</strong> was founded with a simple yet powerful vision: 
                    to make quality education accessible to everyone, regardless of their background or location. 
                    Our core values are <strong className="text-primary">Success</strong>, 
                    <strong className="text-primary"> Achievement</strong>, and <strong className="text-primary">Mastery</strong>.
                  </p>
                  
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Based in Mahuva, Gujarat, we started as a small initiative to help local students gain 
                    digital skills. Today, we've grown into a comprehensive learning platform serving 
                    students across India with courses in digital marketing, technology, business, and more.
                  </p>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    Our courses are designed by industry experts who understand what it takes to succeed 
                    in today's competitive world. We focus on practical, hands-on learning that gives 
                    our students the confidence and skills to excel in their careers.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-to-r from-primary to-purple-600">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => <motion.div key={stat.label} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5,
              delay: index * 0.1
            }} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/80 text-sm sm:text-base">
                    {stat.label}
                  </div>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                What Drives Us
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our commitment to excellence and student success guides everything we do.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((item, index) => <motion.div key={item.title} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5,
              delay: index * 0.1
            }} className="bg-card rounded-2xl p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 lg:py-24 bg-card/50">
          <div className="container mx-auto px-4">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                Why Choose SHREE ADS
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                What Makes Us Different
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're not just another learning platform — we're your partner in success.
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => <motion.div key={feature.title} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5,
              delay: index * 0.1
            }} className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="bg-gradient-to-br from-primary via-purple-600 to-orange-500 rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
              
              <div className="relative z-10">
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Ready to Start Learning?
                </h2>
                <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
                  Join thousands of students who have transformed their careers with SHREE ADS.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" className="text-primary" asChild>
                    <Link to="/courses">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Explore Courses
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                    <Link to="/contact">
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default About;