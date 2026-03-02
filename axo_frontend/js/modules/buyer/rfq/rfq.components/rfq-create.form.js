/* =========================================================
   AXO NETWORKS — RFQ CREATE FORM (SAAS PREMIUM VERSION)
   - No nested overlay
   - Icon safe
   - Proper spacing system
   - Clean hierarchy
   - Enterprise alignment
========================================================= */

import { refreshLucideIcons } from "../../core/buyer-icons.js";

/* =========================================================
   CONSTANTS
========================================================= */

const ppapOptions = [1, 2, 3, 4, 5];

/* =========================================================
   COMPONENT
========================================================= */

export const RFQCreateForm = {

  /* =========================================================
     RENDER (NO OVERLAY HERE)
  ========================================================= */
  render() {

    return `
      <div class="modal-header create-header">
        <h3>
          <i data-lucide="plus-circle"></i>
          Create RFQ
        </h3>

        <button class="modal-close" data-close>
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body create-body">

        <div class="form-group">
          <label>Part Name</label>
          <input 
            type="text"
            id="rfqPartName"
            placeholder="Enter part name"
          />
        </div>

        <div class="form-group">
          <label>Part Description</label>
          <textarea
            id="rfqDescription"
            rows="4"
            placeholder="Enter part description"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Quantity</label>
            <input
              type="number"
              id="rfqQuantity"
              min="1"
              placeholder="Enter quantity"
            />
          </div>

          <div class="form-group">
            <label>PPAP Level</label>
            <select id="rfqPPAP">
              ${ppapOptions.map(level => `
                <option value="${level}">
                  Level ${level}
                </option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Priority</label>
          <select id="rfqPriority">
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div class="form-group">
          <label>Design File</label>

          <div class="file-upload-zone">
            <input
              type="file"
              id="rfqDesignFile"
              accept=".pdf,.step,.stp,.dwg,.png,.jpg"
            />

            <div class="file-meta" id="rfqFileMeta">
              <i data-lucide="upload"></i>
              <span>No file selected</span>
            </div>
          </div>
        </div>

        <div class="modal-actions create-actions">
          <button class="btn-secondary" data-close>
            Cancel
          </button>

          <button class="btn-primary" data-submit-rfq>
            <i data-lucide="send"></i>
            Submit RFQ
          </button>
        </div>

      </div>
    `;
  },

  /* =========================================================
     FILE PREVIEW
  ========================================================= */
  bindFilePreview() {

    const input = document.getElementById("rfqDesignFile");
    const meta = document.getElementById("rfqFileMeta");

    if (!input || !meta) return;

    input.addEventListener("change", () => {

      const file = input.files?.[0];

      if (!file) {
        meta.innerHTML = `
          <i data-lucide="upload"></i>
          <span>No file selected</span>
        `;
      } else {
        meta.innerHTML = `
          <i data-lucide="file-text"></i>
          <span>${file.name}</span>
        `;
      }

      refreshLucideIcons();
    });
  },

  /* =========================================================
     EXTRACT DATA
  ========================================================= */
  getFormData() {

    return {
      part_name:
        document.getElementById("rfqPartName")?.value?.trim() || "",

      part_description:
        document.getElementById("rfqDescription")?.value?.trim() || "",

      quantity:
        Number(document.getElementById("rfqQuantity")?.value || 0),

      ppap_level:
        Number(document.getElementById("rfqPPAP")?.value || 0),

      priority:
        document.getElementById("rfqPriority")?.value || "normal",

      file:
        document.getElementById("rfqDesignFile")?.files?.[0] || null
    };
  },

  /* =========================================================
     VALIDATION
  ========================================================= */
  validate(data) {

    if (!data.part_name)
      return "Part name is required";

    if (!data.quantity || data.quantity <= 0)
      return "Valid quantity required";

    if (!data.ppap_level)
      return "PPAP level required";

    return null;
  }
};