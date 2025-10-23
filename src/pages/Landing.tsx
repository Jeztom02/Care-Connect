import { Link } from "react-router-dom";
import { ArrowRight, Heart, Shield, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-medical.jpg";

export const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Full-Screen Background */}
      <section 
        className="hero-fullscreen min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Floating Background Decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="animate-gentle-float absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
          <div className="animate-gentle-float absolute bottom-32 right-20 w-24 h-24 bg-secondary/10 rounded-full blur-xl" style={{ animationDelay: '2s' }}></div>
          <div className="animate-gentle-float absolute top-1/2 left-1/3 w-20 h-20 bg-accent/10 rounded-full blur-xl" style={{ animationDelay: '4s' }}></div>
        </div>
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 text-center">
          <div className="space-y-8">
            <div className="animate-slide-up">
              <div className="inline-flex items-center bg-primary/20 text-primary-light px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                <Heart className="h-4 w-4 mr-2" />
                Healthcare Innovation
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Compassionate Care,{" "}
                <span className="text-primary-light">Simplified</span>
              </h1>
              
              <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
                Connect patients, doctors, and caregivers in one seamless platform. 
                Experience healthcare management that puts humanity first.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button className="btn-medical text-lg px-8 py-4 group">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    variant="outline" 
                    className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary text-lg px-8 py-4"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose Care Connect?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built with care professionals and patients in mind, our platform streamlines 
              healthcare communication and management.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart className="h-12 w-12 text-primary" />,
                title: "Patient-Centered Care",
                description: "Put patients at the heart of every interaction with intuitive tools for communication and care coordination."
              },
              {
                icon: <Shield className="h-12 w-12 text-secondary" />,
                title: "Secure & Compliant",
                description: "HIPAA-compliant platform ensuring your health data remains private and secure at all times."
              },
              {
                icon: <Users className="h-12 w-12 text-accent" />,
                title: "Team Collaboration",
                description: "Connect doctors, nurses, patients, and families in one unified communication platform."
              },
              {
                icon: <Clock className="h-12 w-12 text-medical-trust" />,
                title: "Real-Time Updates",
                description: "Get instant notifications and updates on patient status, medication schedules, and care plans."
              },
              {
                icon: <Heart className="h-12 w-12 text-medical-healing" />,
                title: "Compassionate Design",
                description: "Every feature designed with empathy, ensuring healthcare feels more human and less clinical."
              },
              {
                icon: <Shield className="h-12 w-12 text-medical-gentle" />,
                title: "Emergency Ready",
                description: "Quick access to emergency contacts and critical health information when it matters most."
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="medical-card text-center group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mx-auto mb-4 p-3 bg-muted rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 primary-gradient text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of healthcare professionals and patients who trust Care Connect 
            for their daily healthcare communication and management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4 font-semibold">
                Start Free Today
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                variant="outline" 
                className="border-white text-white bg-transparent hover:bg-white hover:text-primary text-lg px-8 py-4 font-semibold"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};