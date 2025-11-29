"use client";

import React from "react";
import { Box, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { CVData, CVTemplate } from "@/app/lib/generateCV";

interface CVPreviewContentProps {
  template: CVTemplate;
  cvData: CVData;
}

export const CVPreviewContent: React.FC<CVPreviewContentProps> = ({
  template,
  cvData,
}) => {
  const displayName =
    cvData.profile.first_name_en || cvData.profile.first_name_th || "N/A";
  const displayLastName =
    cvData.profile.last_name_en || cvData.profile.last_name_th || "";
  const fullName = `${displayName} ${displayLastName}`.trim();

  if (template === "modern") {
    return (
      <Box
        sx={{
          fontFamily: "'Roboto', sans-serif",
          color: "#1f2937",
          lineHeight: 1.6,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: "#1f2937",
              fontSize: "2rem",
            }}
          >
            {fullName}
          </Typography>
          {cvData.jobPreference.position && (
            <Typography
              variant="h6"
              sx={{
                color: "#6366f1",
                fontWeight: 500,
                mb: 2,
                fontSize: "1.25rem",
              }}
            >
              {cvData.jobPreference.position}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {cvData.profile.phone && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Phone: {cvData.profile.phone}
              </Typography>
            )}
            {cvData.profile.email && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Email: {cvData.profile.email}
              </Typography>
            )}
            {cvData.address && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {[
                  cvData.address.subdistrict,
                  cvData.address.district,
                  cvData.address.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: "#e5e7eb" }} />

        {/* About Me */}
        {cvData.aboutMe && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: "#1f2937",
                fontSize: "1.25rem",
              }}
            >
              About Me
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#4b5563", whiteSpace: "pre-wrap" }}
            >
              {cvData.aboutMe}
            </Typography>
          </Box>
        )}

        {/* Education */}
        {cvData.educations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: "#1f2937",
                fontSize: "1.25rem",
              }}
            >
              Education
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#6366f1" }}>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      School
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Degree
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Major
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Period
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cvData.educations.map((edu, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        bgcolor: index % 2 === 0 ? "#f9fafb" : "white",
                      }}
                    >
                      <TableCell>{edu.school || "N/A"}</TableCell>
                      <TableCell>{edu.degree || "N/A"}</TableCell>
                      <TableCell>{edu.major || "-"}</TableCell>
                      <TableCell>
                        {edu.start_date} - {edu.end_date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Experience */}
        {cvData.experiences.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: "#1f2937",
                fontSize: "1.25rem",
              }}
            >
              Experience
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#6366f1" }}>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Company
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Position
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Period
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cvData.experiences.map((exp, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        bgcolor: index % 2 === 0 ? "#f9fafb" : "white",
                      }}
                    >
                      <TableCell>{exp.company || "N/A"}</TableCell>
                      <TableCell>{exp.position || "N/A"}</TableCell>
                      <TableCell>{exp.position_type || "-"}</TableCell>
                      <TableCell>
                        {exp.start_date} - {exp.end_date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    );
  }

  if (template === "classic") {
    return (
      <Box
        sx={{
          fontFamily: "'Times New Roman', serif",
          color: "#1f2937",
          lineHeight: 1.8,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, borderBottom: "2px solid #1f2937", pb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: "#1f2937",
              fontSize: "2rem",
              letterSpacing: "0.5px",
            }}
          >
            {fullName}
          </Typography>
          {cvData.jobPreference.position && (
            <Typography
              variant="body1"
              sx={{
                color: "#4b5563",
                fontWeight: 500,
                fontSize: "1rem",
              }}
            >
              {cvData.jobPreference.position}
            </Typography>
          )}
          <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
            {cvData.profile.phone && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {cvData.profile.phone}
              </Typography>
            )}
            {cvData.profile.email && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {cvData.profile.email}
              </Typography>
            )}
          </Box>
        </Box>

        {/* About Me */}
        {cvData.aboutMe && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#1f2937",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontSize: "1rem",
              }}
            >
              Professional Summary
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#4b5563", whiteSpace: "pre-wrap" }}
            >
              {cvData.aboutMe}
            </Typography>
          </Box>
        )}

        {/* Education */}
        {cvData.educations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: "#1f2937",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontSize: "1rem",
              }}
            >
              Education
            </Typography>
            {cvData.educations.map((edu, index) => (
              <Box key={index} sx={{ mb: 2, pl: 2, borderLeft: "3px solid #1f2937" }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {edu.school || "N/A"} - {edu.degree || "N/A"}
                </Typography>
                {edu.major && (
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5 }}>
                    Major: {edu.major}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  {edu.start_date} - {edu.end_date}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Experience */}
        {cvData.experiences.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: "#1f2937",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontSize: "1rem",
              }}
            >
              Work Experience
            </Typography>
            {cvData.experiences.map((exp, index) => (
              <Box key={index} sx={{ mb: 2, pl: 2, borderLeft: "3px solid #1f2937" }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {exp.position || "N/A"} at {exp.company || "N/A"}
                </Typography>
                {exp.position_type && (
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5 }}>
                    Type: {exp.position_type}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  {exp.start_date} - {exp.end_date}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Minimal template
  return (
    <Box
      sx={{
        fontFamily: "'Inter', sans-serif",
        color: "#1f2937",
        lineHeight: 1.6,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "left" }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            color: "#1f2937",
            fontSize: "2rem",
            letterSpacing: "-0.5px",
          }}
        >
          {fullName}
        </Typography>
        {cvData.jobPreference.position && (
          <Typography
            variant="body1"
            sx={{
              color: "#6b7280",
              mb: 2,
              fontSize: "0.95rem",
            }}
          >
            {cvData.jobPreference.position}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", fontSize: "0.875rem" }}>
          {cvData.profile.phone && (
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              {cvData.profile.phone}
            </Typography>
          )}
          {cvData.profile.email && (
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              {cvData.profile.email}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ height: "1px", bgcolor: "#e5e7eb", mb: 3 }} />

      {/* About Me */}
      {cvData.aboutMe && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "#1f2937",
              fontSize: "0.95rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            About
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#4b5563", whiteSpace: "pre-wrap", fontSize: "0.9rem" }}
          >
            {cvData.aboutMe}
          </Typography>
        </Box>
      )}

      {/* Education */}
      {cvData.educations.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: "#1f2937",
              fontSize: "0.95rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Education
          </Typography>
          {cvData.educations.map((edu, index) => (
            <Box key={index} sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.25 }}>
                {edu.school || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.25 }}>
                {edu.degree || "N/A"}
                {edu.major && ` • ${edu.major}`}
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                {edu.start_date} - {edu.end_date}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Experience */}
      {cvData.experiences.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: "#1f2937",
              fontSize: "0.95rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Experience
          </Typography>
          {cvData.experiences.map((exp, index) => (
            <Box key={index} sx={{ mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.25 }}>
                {exp.position || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.25 }}>
                {exp.company || "N/A"}
                {exp.position_type && ` • ${exp.position_type}`}
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                {exp.start_date} - {exp.end_date}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

