import React from 'react';
import { motion } from 'framer-motion';

const TimelineItem = ({ item, idx, hovered, setHovered, itemType }) => {
  const itemKey = `${itemType}-${idx}`;
  
  return (
    <motion.div
      className={`timeline-item ${item.type}`}
      key={itemKey}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: idx * 0.2 }}
      onMouseEnter={() => setHovered(itemKey)}
      onMouseLeave={() => setHovered(null)}
    >
      <div className={`timeline-dot ${item.type === 'education' ? 'education' : ''}`} />
      <div className={`timeline-type-tag ${item.type}`}>
        {item.type === 'education' ? 'Education' : 'Experience'}
      </div>

      <div className="timeline-content">
        <div className="timeline-header">
          <div className="timeline-year">{item.year}</div>
          
          {item.logo && (
            <div className="timeline-logo-container">
              <img 
                src={item.logo} 
                alt={`${item.company} logo`} 
                className="timeline-logo" 
              />
            </div>
          )}
          
          <div className="timeline-title-container">
            <h3 className="timeline-job-title">{item.title}</h3>
            <div className="timeline-company-container">
              <span className="timeline-company">
                {item.company}
              </span>
              {item.website && (
                <a 
                  href={item.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="timeline-website-link"
                  aria-label={`Visit ${item.company} website`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="timeline-description-container">
          {hovered === itemKey && (
            <motion.div
              className="timeline-description"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {item.description}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TimelineItem;
