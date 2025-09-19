import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load internships data from JSON file
let internshipsData = null;

function loadInternshipsData() {
  if (internshipsData === null) {
    try {
      const dataPath = path.join(__dirname, 'data', 'internships.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      internshipsData = JSON.parse(rawData);
      console.log(`✅ Loaded ${internshipsData.length} internships from JSON data`);
    } catch (error) {
      console.error('❌ Error loading internships data:', error);
      internshipsData = [];
    }
  }
  return internshipsData;
}

/**
 * Get all internships
 * @returns {Array} Array of all internships
 */
export function getAllInternships() {
  return loadInternshipsData();
}

/**
 * Get internship by ID
 * @param {string} id - The internship ID
 * @returns {Object|null} The internship object or null if not found
 */
export function getById(id) {
  const internships = loadInternshipsData();
  return internships.find(internship => internship.id === id) || null;
}

/**
 * Filter internships based on criteria
 * @param {Object} criteria - Filter criteria
 * @param {string} criteria.education - Education level filter
 * @param {string} criteria.department - Department filter
 * @param {string} criteria.sector - Sector filter
 * @param {string} criteria.location - Location filter
 * @param {Array} criteria.skills - Skills filter (array of skills)
 * @returns {Array} Filtered internships
 */
export function filter(criteria = {}) {
  const internships = loadInternshipsData();
  
  return internships.filter(internship => {
    // Education filter
    if (criteria.education && 
        internship.education.toLowerCase() !== criteria.education.toLowerCase()) {
      return false;
    }
    
    // Department filter
    if (criteria.department && 
        internship.department.toLowerCase() !== criteria.department.toLowerCase()) {
      return false;
    }
    
    // Sector filter
    if (criteria.sector && 
        internship.sector.toLowerCase() !== criteria.sector.toLowerCase()) {
      return false;
    }
    
    // Location filter
    if (criteria.location && 
        internship.location.toLowerCase() !== criteria.location.toLowerCase()) {
      return false;
    }
    
    // Skills filter - check if any of the required skills match
    if (criteria.skills && Array.isArray(criteria.skills) && criteria.skills.length > 0) {
      const internshipSkills = internship.skills.map(skill => skill.toLowerCase());
      const requiredSkills = criteria.skills.map(skill => skill.toLowerCase());
      const hasMatchingSkill = requiredSkills.some(skill => 
        internshipSkills.some(internSkill => internSkill.includes(skill) || skill.includes(internSkill))
      );
      if (!hasMatchingSkill) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Search internships by text query
 * @param {string} query - Search query
 * @returns {Array} Matching internships
 */
export function search(query) {
  if (!query || query.trim().length === 0) {
    return getAllInternships();
  }
  
  const internships = loadInternshipsData();
  const searchTerm = query.toLowerCase();
  
  return internships.filter(internship => {
    return (
      internship.title.toLowerCase().includes(searchTerm) ||
      internship.company.toLowerCase().includes(searchTerm) ||
      internship.description.toLowerCase().includes(searchTerm) ||
      internship.skills.some(skill => skill.toLowerCase().includes(searchTerm)) ||
      internship.sector.toLowerCase().includes(searchTerm) ||
      internship.location.toLowerCase().includes(searchTerm)
    );
  });
}

/**
 * Get distinct values for autocomplete
 * @param {string} field - Field name to get distinct values for
 * @param {string} query - Optional query to filter results
 * @returns {Array} Array of distinct values
 */
export function getDistinctValues(field, query = '') {
  const internships = loadInternshipsData();
  const values = new Set();
  
  internships.forEach(internship => {
    if (field === 'skills') {
      // Handle skills array
      if (internship.skills && Array.isArray(internship.skills)) {
        internship.skills.forEach(skill => {
          if (!query || skill.toLowerCase().includes(query.toLowerCase())) {
            values.add(skill);
          }
        });
      }
    } else if (internship[field]) {
      // Handle single value fields
      const value = internship[field].toString();
      if (!query || value.toLowerCase().includes(query.toLowerCase())) {
        values.add(value);
      }
    }
  });
  
  return Array.from(values).sort().slice(0, 10);
}

/**
 * Reload data from JSON file (useful for development)
 */
export function reloadData() {
  internshipsData = null;
  return loadInternshipsData();
}
