import React, { useState, useEffect } from 'react';

const ProfessionalCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Find Your Perfect Internship",
      subtitle: "AI-Powered Matching System",
      description: "Discover internships tailored to your skills, education, and career goals with our advanced recommendation engine.",
      image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "Start Searching",
      color: "from-blue-600 to-blue-800"
    },
    {
      id: 2,
      title: "Government Sponsored Programs",
      subtitle: "Ministry of Corporate Affairs",
      description: "Access exclusive internship opportunities with leading corporations through our government-backed initiative.",
      image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "Explore Programs",
      color: "from-green-600 to-green-800"
    },
    {
      id: 3,
      title: "Skill Development & Growth",
      subtitle: "Learn from Industry Experts",
      description: "Enhance your skills with structured learning paths and mentorship from top professionals in your field.",
      image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "View Learning Paths",
      color: "from-purple-600 to-purple-800"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-lg shadow-2xl">
      {/* Carousel Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="relative w-full h-full">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              
              {/* Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} bg-opacity-80`} />
              
              {/* Content */}
              <div className="relative z-10 flex items-center h-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-2xl">
                    <div className="mb-4">
                      <span className="inline-block px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                        {slide.subtitle}
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-xl text-white mb-8 leading-relaxed opacity-90">
                      {slide.description}
                    </p>
                    <button className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg">
                      {slide.cta}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfessionalCarousel;