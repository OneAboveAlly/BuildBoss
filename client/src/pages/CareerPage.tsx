import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  RocketLaunchIcon,
  HeartIcon,
  TrophyIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const CareerPage: React.FC = () => {
  const { t } = useTranslation(['common', 'homepage']);

  const jobOpenings: any[] = [];

  const benefits = [
    {
      icon: CurrencyDollarIcon,
      title: 'Competitive Salary',
      description: 'Market-leading compensation with annual reviews and performance bonuses'
    },
    {
      icon: HeartIcon,
      title: 'Health & Wellness',
      description: 'Premium health insurance, mental health support, and fitness benefits'
    },
    {
      icon: RocketLaunchIcon,
      title: 'Growth Opportunities',
      description: 'Career development plans, training budget, and internal mobility'
    },
    {
      icon: GlobeAltIcon,
      title: 'Remote-First',
      description: 'Work from anywhere with flexible hours and modern equipment provided'
    },
    {
      icon: AcademicCapIcon,
      title: 'Learning Budget',
      description: '5,000 PLN annually for courses, conferences, and certifications'
    },
    {
      icon: TrophyIcon,
      title: 'Stock Options',
      description: 'Equity participation for all employees in our growing company'
    }
  ];

  const values = [
    {
      title: 'Innovation First',
      description: 'We constantly push boundaries to create better solutions for the construction industry'
    },
    {
      title: 'Customer Obsession',
      description: 'Every decision we make is driven by how it helps our construction company customers succeed'
    },
    {
      title: 'Team Collaboration',
      description: 'We believe the best results come from diverse teams working together toward common goals'
    },
    {
      title: 'Quality Mindset',
      description: 'We take pride in building reliable, scalable software that our customers depend on daily'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">
                Build<span className="text-primary-600">Boss</span>
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link to="/jobs" className="text-gray-600 hover:text-gray-900">
                Job Board
              </Link>
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Join the Future of
            <span className="block text-primary-600">Construction Tech</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Help us revolutionize how construction companies manage their projects. 
            We're building the next generation of tools that make construction more efficient, 
            profitable, and sustainable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#openings"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              View Open Positions
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
            <a
              href="mailto:careers@buildboss.com"
              className="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              <EnvelopeIcon className="mr-2 h-5 w-5" />
              Send CV
            </a>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">250+</div>
              <div className="text-gray-300">Construction Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">45+</div>
              <div className="text-gray-300">Team Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">5M+</div>
              <div className="text-gray-300">Tasks Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do at BuildBoss
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Work at BuildBoss?
            </h2>
            <p className="text-xl text-gray-600">
              We invest in our team because we believe great people build great products
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings Section */}
      <section id="openings" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600">
              Currently we don't have any open positions
            </p>
          </div>
          
          <div className="text-center bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No Open Positions Right Now
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              We're not actively hiring at the moment, but we're always interested in connecting with talented individuals who are passionate about construction technology.
            </p>
            <a
              href="mailto:careers@buildboss.com?subject=Future Opportunities&body=Hi BuildBoss Team,%0D%0A%0D%0AI'm interested in future opportunities at BuildBoss. Please find my CV attached.%0D%0A%0D%0ABest regards"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              <EnvelopeIcon className="mr-2 h-5 w-5" />
              Send Your CV for Future Opportunities
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build the Future?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join our mission to revolutionize the construction industry with cutting-edge technology
          </p>
          <a
            href="mailto:careers@buildboss.com"
            className="bg-white hover:bg-gray-100 text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
          >
            <EnvelopeIcon className="mr-2 h-5 w-5" />
            Get in Touch
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BuildingOffice2Icon className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold">
                Site<span className="text-primary-400">Boss</span>
              </span>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="/jobs" className="text-gray-400 hover:text-white transition-colors">
                Job Board
              </Link>
              <a href="mailto:careers@buildboss.com" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 BuildBoss. All rights reserved. | careers@buildboss.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CareerPage; 