/**
 * Utility functions for formatting and sorting Worksites (Obras) consistently across the application.
 */

/**
 * Formats a worksite ID and name into the standard display string.
 * Format: "ID - Name"
 * @param {string|number} id - The worksite ID
 * @param {string} name - The worksite name
 * @returns {string} Formatted string
 */
export const formatObraDisplay = (id, name) => {
    if (!id && !name) return '';
    if (!id) return name;
    if (!name) return String(id);
    return `${id} - ${name}`;
  };
  
  /**
   * Comparator function to sort worksite objects by ID ascending.
   * Usage: worksites.sort(sortObrasById)
   * @param {object} a - Worksite object a (must have id property)
   * @param {object} b - Worksite object b (must have id property)
   * @returns {number} Sort order
   */
  export const sortObrasById = (a, b) => {
    return Number(a.id) - Number(b.id);
  };
  
  /**
   * Helper to transform an obra object into a select/combobox option
   * @param {object} obra - The worksite object
   * @returns {object} { value: string, label: string }
   */
  export const formatObraOption = (obra) => ({
    value: String(obra.id),
    label: formatObraDisplay(obra.id, obra.nome)
  });