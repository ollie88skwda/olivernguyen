import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import "../styles/ExperiencesTimeline.css";

const experiences = [
  {
    year: "2024 (Present)",
    title: "Lead Developer",
    company: "Modern Web App",
    description: "Leading the development of a modern web application using NextJS and context, implementing features like real-time order tracking and inventory management. Introduced automated testing and CI/CD pipelines for reliable deployments.",
  },
  {
    year: "Mid 2024",
    title: "Digital Transformation Specialist",
    company: "Computer Engineering Department",
    description: "Worked on digital transformation for the Computer Engineering department. Built a faculty and record management portal, digitized paper records, and improved department workflows.",
  },
  // Add more experiences as needed
];

export const ExperiencesTimeline = () => {
  const timelineRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const controls = useAnimation();
  const isInView = useInView(timelineRef, { once: false, margin: "-100px" });
  
  useEffect(() => {
    if (isInView) controls.start({ scaleY: 1 });
    else controls.start({ scaleY: 0 });
  }, [isInView, controls]);

  return (
    <div className="experiences-section">
      <motion.h1 
        className="section-title"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Experience & Education
      </motion.h1>
      
      <motion.p 
        className="section-subtitle"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Here's a summary of my professional journey and educational background in software development.
      </motion.p>
      
      <h2 className="experience-heading">Experience</h2>
      
      <div className="timeline-container">
        <motion.div
          className="timeline-bar"
          ref={timelineRef}
          initial={{ scaleY: 0 }}
          animate={controls}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        <div className="timeline-items">
          {experiences.map((exp, idx) => (
            <motion.div
              className={`timeline-item ${hovered === idx ? 'expanded' : ''}`}
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: idx * 0.2 }}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="timeline-dot" />
              
              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-year">{exp.year}</div>
                  <div className="timeline-title-container">
                    <h3 className="timeline-job-title">{exp.title}</h3>
                    <span className="timeline-company">{exp.company}</span>
                  </div>
                </div>
                
                <motion.div 
                  className="timeline-description"
                  initial={{ height: 0, opacity: 0 }}
                  animate={hovered === idx ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {exp.description}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperiencesTimeline;
