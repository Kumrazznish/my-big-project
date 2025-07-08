import React, { useState } from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { 
  Brain, 
  Zap, 
  Target, 
  Users, 
  BookOpen, 
  Award, 
  ArrowRight, 
  CheckCircle,
  Star,
  Play,
  TrendingUp,
  Clock,
  Sparkles,
  Rocket,
  Shield,
  Globe,
  ChevronRight,
  BarChart3,
  Lightbulb,
  Code,
  Palette,
  Calculator,
  Database,
  Smartphone,
  Camera
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Personalization',
      description: 'Advanced machine learning algorithms create truly personalized learning experiences that adapt to your unique style, pace, and goals.',
      highlight: 'Smart Adaptation'
    },
    {
      icon: Rocket,
      title: 'Accelerated Learning Paths',
      description: 'Our proprietary methodology reduces learning time by up to 60% through optimized content sequencing and spaced repetition.',
      highlight: '60% Faster'
    },
    {
      icon: Target,
      title: 'Precision Skill Mapping',
      description: 'Detailed skill assessments and gap analysis ensure you focus on exactly what you need to learn for maximum impact.',
      highlight: 'Laser Focus'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Comprehensive learning analytics provide insights into your progress, strengths, and areas for improvement.',
      highlight: 'Data-Driven'
    },
    {
      icon: Shield,
      title: 'Industry Certification',
      description: 'Earn recognized certifications and badges that validate your skills to employers and peers.',
      highlight: 'Verified Skills'
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Connect with learners worldwide, participate in challenges, and learn from diverse perspectives.',
      highlight: 'Connected Learning'
    }
  ];

  const subjects = [
    { icon: Code, name: 'Programming', color: 'from-blue-500 to-cyan-500', students: '125K+' },
    { icon: Palette, name: 'Design', color: 'from-purple-500 to-pink-500', students: '89K+' },
    { icon: Database, name: 'Data Science', color: 'from-green-500 to-emerald-500', students: '156K+' },
    { icon: Smartphone, name: 'Mobile Dev', color: 'from-orange-500 to-red-500', students: '78K+' },
    { icon: Calculator, name: 'Mathematics', color: 'from-indigo-500 to-purple-500', students: '92K+' },
    { icon: Camera, name: 'Digital Media', color: 'from-pink-500 to-rose-500', students: '64K+' }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Senior Software Engineer at Google',
      content: 'The AI-powered roadmaps are incredibly precise. I went from beginner to landing my dream job at Google in just 8 months.',
      rating: 5,
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      achievement: 'Career Transition Success'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Lead Data Scientist at Netflix',
      content: 'The personalized learning approach helped me master machine learning concepts 3x faster than traditional methods.',
      rating: 5,
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      achievement: 'Skill Mastery'
    },
    {
      name: 'Emily Johnson',
      role: 'Principal UX Designer at Airbnb',
      content: 'The real-time feedback and adaptive content made learning design principles intuitive and engaging.',
      rating: 5,
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      achievement: 'Design Excellence'
    }
  ];

  const stats = [
    { number: '500K+', label: 'Active Learners', icon: Users },
    { number: '2,500+', label: 'Learning Paths', icon: BookOpen },
    { number: '98.5%', label: 'Success Rate', icon: TrendingUp },
    { number: '24/7', label: 'AI Support', icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  LearnAI Pro
                </span>
                <div className="text-xs text-cyan-400 font-medium">Next-Gen Learning</div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors font-medium">Features</a>
              <a href="#subjects" className="text-gray-300 hover:text-white transition-colors font-medium">Subjects</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors font-medium">Success Stories</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors font-medium">Pricing</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <SignInButton mode="modal">
                <button className="text-gray-300 hover:text-white font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105">
                  Start Free Trial
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium">AI-Powered Learning Revolution</span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Master Skills
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    10x Faster
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                  Revolutionary AI technology creates hyper-personalized learning experiences that adapt in real-time. 
                  Join 500,000+ learners who've accelerated their careers with our intelligent platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <SignUpButton mode="modal">
                  <button className="group bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 flex items-center justify-center">
                    Start Learning Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignUpButton>
                <button className="group border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl hover:border-gray-400 hover:bg-white/5 transition-all duration-300 font-semibold text-lg flex items-center justify-center">
                  <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 border-3 border-slate-900 flex items-center justify-center text-white font-bold text-sm">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-400 font-medium">4.9/5 from 50,000+ reviews</p>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Interactive Dashboard Preview */}
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Learning Dashboard</h3>
                        <p className="text-sm text-gray-400">Real-time Progress</p>
                      </div>
                    </div>
                    <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                      On Track
                    </div>
                  </div>
                  
                  {/* Progress Rings */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'JavaScript', progress: 85, color: 'from-yellow-400 to-orange-500' },
                      { label: 'React', progress: 72, color: 'from-blue-400 to-cyan-500' },
                      { label: 'Node.js', progress: 58, color: 'from-green-400 to-emerald-500' }
                    ].map((skill, index) => (
                      <div key={skill.label} className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              className="text-gray-700"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="url(#gradient-${index})"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - skill.progress / 100)}`}
                              className="transition-all duration-1000"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{skill.progress}%</span>
                          </div>
                          <defs>
                            <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" className={`stop-color-gradient-${index}-start`} />
                              <stop offset="100%" className={`stop-color-gradient-${index}-end`} />
                            </linearGradient>
                          </defs>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">{skill.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* AI Recommendations */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm font-medium">AI Recommendation</span>
                    </div>
                    <p className="text-white text-sm">
                      Focus on async/await patterns to boost your JavaScript mastery by 23%
                    </p>
                    <button className="mt-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform">
                      Start Learning
                    </button>
                  </div>
                  
                  {/* Achievement */}
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3">
                    <Award className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-white font-medium text-sm">New Achievement!</p>
                      <p className="text-green-400 text-xs">React Hooks Master</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-3 shadow-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-3 shadow-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black/20 backdrop-blur-xl border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Advanced Features</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
              The Future of Learning
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience cutting-edge AI technology that revolutionizes how you learn, 
              making education more efficient, personalized, and engaging than ever before.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-cyan-500/30 transition-all duration-500 hover:scale-105 cursor-pointer ${
                    activeFeature === index ? 'border-cyan-500/50 shadow-2xl shadow-cyan-500/20' : ''
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {feature.highlight}
                        </span>
                      </div>
                      <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-32 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
              Master Any Subject
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From programming to design, our AI adapts to any domain with expert-level curriculum and real-world projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <div key={index} className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-cyan-500/30 transition-all duration-500 hover:scale-105 cursor-pointer">
                  <div className="text-center space-y-6">
                    <div className={`w-20 h-20 bg-gradient-to-r ${subject.color} rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-2xl`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{subject.name}</h3>
                      <p className="text-cyan-400 font-medium">{subject.students} students</p>
                    </div>
                    <button className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 py-3 rounded-xl hover:from-cyan-500/30 hover:to-purple-500/30 transition-all duration-300 font-medium group-hover:scale-105">
                      Explore Paths
                      <ChevronRight className="inline-block ml-2 w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-400">
              Real people, real results, real career transformations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-cyan-500/30 transition-all duration-500 hover:scale-105">
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-8 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center space-x-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                    <div className="text-cyan-400 text-xs font-medium mt-1">{testimonial.achievement}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-16 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
                Ready to Transform Your Future?
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Join the learning revolution. Start your personalized AI-powered journey today and unlock your potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SignUpButton mode="modal">
                  <button className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-10 py-4 rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-cyan-500/25 hover:scale-105">
                    Start Free Trial
                  </button>
                </SignUpButton>
                <button className="border-2 border-gray-600 text-gray-300 px-10 py-4 rounded-xl hover:border-gray-400 hover:bg-white/5 transition-all duration-300 font-semibold text-lg">
                  Schedule Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-xl border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  LearnAI Pro
                </span>
              </div>
              <p className="text-gray-400 max-w-xs">
                Revolutionizing education with AI-powered personalized learning experiences.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2025 LearnAI Pro. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;