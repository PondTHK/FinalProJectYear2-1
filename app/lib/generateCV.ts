import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export type CVTemplate = "modern" | "classic" | "minimal";

export interface CVData {
  profile: {
    title?: string | null;
    first_name_th?: string | null;
    last_name_th?: string | null;
    first_name_en?: string | null;
    last_name_en?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    nationality?: string | null;
    phone?: string | null;
    email?: string | null;
    profile_image_url?: string | null;
  };
  address: {
    province?: string | null;
    district?: string | null;
    subdistrict?: string | null;
    postal_code?: string | null;
  } | null;
  educations: Array<{
    school: string;
    degree: string;
    major?: string | null;
    start_date: string;
    end_date: string;
    description?: string | null;
  }>;
  experiences: Array<{
    company: string;
    position: string;
    position_type?: string | null;
    start_date: string;
    end_date: string;
    description?: string | null;
  }>;
  jobPreference: {
    position?: string | null;
  };
  aboutMe?: string | null;
}

// Helper function to create HTML element for CV
const createCVHTML = (data: CVData, template: CVTemplate): HTMLElement => {
  // Load Thai font from Google Fonts
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);

  const container = document.createElement("div");
  container.style.width = "210mm";
  container.style.minHeight = "297mm";
  container.style.padding = "20mm";
  container.style.backgroundColor = "#ffffff";
  container.style.fontFamily = template === "classic"
    ? "'Sarabun', 'Times New Roman', serif"
    : "'Sarabun', 'Roboto', 'Noto Sans Thai', sans-serif";
  container.style.color = "#1f2937";
  container.style.lineHeight = "1.6";
  container.style.fontSize = "12pt";

  const displayName = data.profile.first_name_en || data.profile.first_name_th || "N/A";
  const displayLastName = data.profile.last_name_en || data.profile.last_name_th || "";
  const fullName = `${displayName} ${displayLastName}`.trim();

  // Template-specific colors
  const templateColors: Record<CVTemplate, { primary: string; secondary: string }> = {
    modern: { primary: "#6366f1", secondary: "#8b5cf6" },
    classic: { primary: "#1f2937", secondary: "#4b5563" },
    minimal: { primary: "#111827", secondary: "#6b7280" },
  };

  const colors = templateColors[template];

  let html = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 32pt; font-weight: 700; margin-bottom: 10px; color: #1f2937;">
        ${fullName}
      </h1>
      ${data.jobPreference.position ? `
        <h2 style="font-size: 18pt; color: ${colors.primary}; font-weight: 500; margin-bottom: 20px;">
          ${data.jobPreference.position}
        </h2>
      ` : ""}
      <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-bottom: 20px;">
        ${data.profile.phone ? `<span>Phone: ${data.profile.phone}</span>` : ""}
        ${data.profile.email ? `<span>Email: ${data.profile.email}</span>` : ""}
        ${data.address && (data.address.province || data.address.district) ? `
          <span>Address: ${[data.address.subdistrict, data.address.district, data.address.province].filter(Boolean).join(", ")}</span>
        ` : ""}
      </div>
    </div>
    <hr style="border: 1px solid ${colors.secondary}; margin: 20px 0;">
  `;

  // About Me Section
  if (data.aboutMe && data.aboutMe.trim()) {
    html += `
      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16pt; font-weight: 700; margin-bottom: 10px; color: ${colors.primary};">
          About Me
        </h3>
        <p style="font-size: 11pt; line-height: 1.8; text-align: justify;">
          ${data.aboutMe.replace(/\n/g, "<br>")}
        </p>
      </div>
    `;
  }

  // Education Section
  if (data.educations.length > 0) {
    html += `
      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16pt; font-weight: 700; margin-bottom: 15px; color: ${colors.primary};">
          Education
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <thead>
            <tr style="background-color: ${colors.primary}; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">School</th>
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">Degree</th>
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">Major</th>
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">Period</th>
            </tr>
          </thead>
          <tbody>
            ${data.educations.map((edu: CVData["educations"][0]) => `
              <tr style="background-color: ${template === "minimal" ? "transparent" : "#f9fafb"};">
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${edu.school || "N/A"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${edu.degree || "N/A"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${edu.major || "-"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${edu.start_date} - ${edu.end_date}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // Experience Section
  if (data.experiences.length > 0) {
    html += `
      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16pt; font-weight: 700; margin-bottom: 15px; color: ${colors.primary};">
          Experience
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <thead>
            <tr style="background-color: ${colors.primary}; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">Company</th>
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">Position</th>
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">Type</th>
              <th style="padding: 10px; text-align: left; border: 1px solid ${colors.secondary};">Period</th>
            </tr>
          </thead>
          <tbody>
            ${data.experiences.map((exp: CVData["experiences"][0]) => `
              <tr style="background-color: ${template === "minimal" ? "transparent" : "#f9fafb"};">
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${exp.company || "N/A"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${exp.position || "N/A"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${exp.position_type || "-"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${exp.start_date} - ${exp.end_date}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = html;
  return container;
};

export const generateCV = async (data: CVData, template: CVTemplate = "modern"): Promise<void> => {
  // Create temporary container
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = "210mm";
  document.body.appendChild(tempContainer);

  try {
    // Create CV HTML element
    const cvElement = createCVHTML(data, template);
    tempContainer.appendChild(cvElement);

    // Wait for fonts to load (including Google Fonts)
    await new Promise<void>((resolve) => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          // Additional wait for Google Fonts to load
          setTimeout(() => resolve(), 500);
        });
      } else {
        setTimeout(() => resolve(), 1000);
      }
    });

    // Convert HTML to canvas with high quality
    const canvas = await html2canvas(cvElement, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: cvElement.offsetWidth,
      height: cvElement.offsetHeight,
    });

    // Calculate PDF dimensions (A4: 210mm x 297mm)
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdfHeight = 297; // A4 height in mm

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Generate filename
    const displayName = data.profile.first_name_en || data.profile.first_name_th || "N/A";
    const displayLastName = data.profile.last_name_en || data.profile.last_name_th || "";
    const fullName = `${displayName} ${displayLastName}`.trim();
    const fileName = `CV_${fullName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;

    // Save PDF
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("ไม่สามารถสร้าง PDF ได้ กรุณาลองอีกครั้ง");
  } finally {
    // Clean up
    document.body.removeChild(tempContainer);
  }
};
