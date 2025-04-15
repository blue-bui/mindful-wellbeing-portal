
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, AlertCircle, BookOpen, Users, Shield, CheckCircle } from 'lucide-react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="wellness-gradient text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <HeartPulse size={32} className="mr-2" />
                <h1 className="text-3xl md:text-4xl font-bold">Preventing Suicide</h1>
              </div>
              <p className="text-xl mb-6 opacity-90">
                An early intervention platform designed to identify and support individuals at risk
              </p>
              <p className="mb-8 opacity-80">
                Using advanced sentiment analysis and machine learning to help HR professionals 
                provide timely support and resources to employees who may be struggling with 
                mental health challenges.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild
                  size="lg" 
                  className="bg-white text-wellness-teal hover:bg-white/90"
                >
                  <Link to="/login">
                    Get Started
                  </Link>
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white/10"
                >
                  <a href="#about">
                    Learn More
                  </a>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <img 
                src="https://plus.unsplash.com/premium_photo-1683120963680-0bcecbc146a9?q=80&w=800&auto=format&fit=crop"
                alt="Mental health support" 
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Important Medical Disclaimer */}
      <div className="container mx-auto px-4 py-8">
        <MedicalDisclaimer />
      </div>
      
      {/* About Section */}
      <div id="about" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-wellness-teal mb-4">About This Project</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            A college minor project developed to demonstrate how technology can be leveraged to 
            address critical mental health challenges in workplace environments.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-wellness-teal/10 p-3 rounded-full mb-4">
                  <AlertCircle size={24} className="text-wellness-teal" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Early Detection</h3>
                <p className="text-muted-foreground">
                  Using machine learning to analyze responses and identify potential risk patterns before crisis situations develop.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-wellness-teal/10 p-3 rounded-full mb-4">
                  <BookOpen size={24} className="text-wellness-teal" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Educational</h3>
                <p className="text-muted-foreground">
                  Provides resources and information about mental health, stress management, and wellbeing for both employees and HR.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-wellness-teal/10 p-3 rounded-full mb-4">
                  <Shield size={24} className="text-wellness-teal" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Privacy-Focused</h3>
                <p className="text-muted-foreground">
                  Designed with privacy and confidentiality as core principles to protect sensitive mental health information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-wellness-light py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-wellness-teal mb-4">Key Features</h2>
            <p className="max-w-2xl mx-auto text-muted-foreground">
              Combining AI, machine learning, and psychological research to create an effective early intervention system
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="bg-wellness-teal/10 p-3 rounded-full mr-4">
                <Users size={24} className="text-wellness-teal" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">HR Management Portal</h3>
                <p className="text-muted-foreground">
                  Enables HR professionals to create personalized assessments, send them to employees, 
                  and review analyzed results to identify those who may need support.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-wellness-teal/10 p-3 rounded-full mr-4">
                <CheckCircle size={24} className="text-wellness-teal" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Question Generation</h3>
                <p className="text-muted-foreground">
                  Utilizes Gemini API to generate contextually appropriate and psychologically sound
                  assessment questions based on HR-provided prompts.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-wellness-teal/10 p-3 rounded-full mr-4">
                <AlertCircle size={24} className="text-wellness-teal" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sentiment Analysis</h3>
                <p className="text-muted-foreground">
                  Machine learning model trained on suicide-related text data to identify potential
                  risk factors in employee responses with high accuracy.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-wellness-teal/10 p-3 rounded-full mr-4">
                <HeartPulse size={24} className="text-wellness-teal" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Resource Connection</h3>
                <p className="text-muted-foreground">
                  Provides employees with access to mental health resources, crisis hotlines,
                  and professional support based on their assessment results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ethical Statement */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-wellness-teal mb-4">Ethical Statement</h2>
          <p className="mb-4">
            This project was developed as a college minor project for educational purposes only. It is not 
            intended for commercial use or as a substitute for professional medical advice, diagnosis, or 
            treatment.
          </p>
          <p className="mb-4">
            We recognize the sensitivity and complexity of mental health issues, particularly those related 
            to suicide prevention. This tool should be used as a complementary resource alongside professional 
            mental health support, not as a replacement.
          </p>
          <p>
            Always consult with qualified mental health professionals when addressing psychological concerns 
            or implementing workplace mental health programs.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-wellness-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <HeartPulse size={24} className="mr-2 text-wellness-blue" />
              <span className="font-semibold">Preventing Suicide</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm opacity-80">
                © {new Date().getFullYear()} Preventing Suicide Project. For educational purposes only.
              </p>
              <p className="text-sm opacity-60 mt-1">
                Not for commercial use. A college minor project.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
