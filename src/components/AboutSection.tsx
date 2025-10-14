import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Award, Zap, Heart, Globe } from "lucide-react";

export function AboutSection() {
  const developers = [
    {
      name: "Grace Joy",
      role: "Full-Stack Developer",
      expertise: "Frontend Development & UI/UX Design (Moringa School)"
    },
    {
      name: "Hosea Herman",
      role: "Full-Stack Developer",
      expertise: "Server Development & Database Management (Edu Link College)"
    }
  ];

  const keyValues = [
    {
      icon: Shield,
      title: "Security First",
      description: "Your network security is our top priority. We implement industry-leading protection protocols."
    },
    {
      icon: Users,
      title: "User-Centric Design",
      description: "Built for everyone - from families to enterprises. Simple interfaces, powerful features."
    },
    {
      icon: Award,
      title: "Proven Reliability",
      description: "99.9% uptime guarantee with 24/7 monitoring and instant threat response."
    },
    {
      icon: Zap,
      title: "AI-Powered Intelligence",
      description: "Smart algorithms that learn your network patterns and optimize performance automatically."
    }
  ];

  const whyChooseUs = [
    "Real-time threat detection and prevention",
    "Intuitive dashboard for all technical levels",
    "Scalable from home networks to enterprise",
    "24/7 expert support team",
    "Advanced analytics and reporting",
    "Regular security updates and improvements"
  ];

  return (
    <div className="space-y-8">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">About Shield Network Guardian</CardTitle>
              <CardDescription>Full-stack network security and optimization platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Shield Network Guardian is a full-stack network security and optimization platform developed by 
            Grace Joy and Herman as part of their diploma studies. It combines real-time monitoring, intelligent 
            threat detection, and performance optimization in one seamless experience.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Built from the ground up using modern technologies, Shield provides users with deep insights into 
            their network activity while ensuring maximum security and usability. It’s a balance between 
            software engineering and cybersecurity — designed by students with a passion for innovation.
          </p>
        </CardContent>
      </Card>

      {/* Key Values */}
      <div>
        <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
          <Heart className="h-5 w-5 text-primary" />
          <span>Our Core Values</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {keyValues.map((value, index) => {
            const ValueIcon = value.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ValueIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{value.title}</h4>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Development Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Meet the Developers</span>
          </CardTitle>
          <CardDescription>The creators behind Shield Network Guardian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {developers.map((dev, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-muted/50">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/60 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg">
                  {dev.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="font-semibold">{dev.name}</h4>
                <p className="text-sm text-primary font-medium">{dev.role}</p>
                <p className="text-xs text-muted-foreground mt-1">{dev.expertise}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Why Choose Us */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Why Choose Shield?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {whyChooseUs.map((reason, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">{reason}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What to Expect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>What to Expect</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <Badge className="mb-2" variant="outline">Setup</Badge>
              <h4 className="font-semibold mb-2">Quick Installation</h4>
              <p className="text-sm text-muted-foreground">
                Get started in minutes with our guided setup process and automatic network detection.
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <Badge className="mb-2" variant="outline">Monitoring</Badge>
              <h4 className="font-semibold mb-2">24/7 Protection</h4>
              <p className="text-sm text-muted-foreground">
                Continuous monitoring with real-time alerts and automatic threat response.
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <Badge className="mb-2" variant="outline">Optimization</Badge>
              <h4 className="font-semibold mb-2">Smart Improvements</h4>
              <p className="text-sm text-muted-foreground">
                AI-driven optimizations that improve performance and prevent issues before they occur.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
