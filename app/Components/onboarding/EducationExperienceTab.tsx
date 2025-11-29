"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import {
  userAPI,
  type UserEducationPayload,
  type UserEducationResponse,
  type UserExperiencePayload,
  type UserExperienceResponse,
} from "@/app/lib/api";
import { useOnboarding } from "@/app/context/OnboardingContext";

const textFieldSlotProps = {
  input: {
    sx: {
      color: "#11121f",
      "&::placeholder": {
        color: "#5c678f",
        opacity: 1,
      },
    },
  },
} as const;

interface EducationFormState {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

type EducationFormErrors = Partial<Record<keyof EducationFormState, string>>;

type StatusState =
  | {
    type: "success" | "error" | "info";
    message: string;
  }
  | null;

const initialEducationForm: EducationFormState = {
  school: "",
  degree: "",
  major: "",
  startDate: "",
  endDate: "",
  description: "",
};

interface ExperienceFormState {
  company: string;
  position: string;
  positionType: string;
  startDate: string;
  endDate: string;
  description: string;
}

type ExperienceFormErrors = Partial<Record<keyof ExperienceFormState, string>>;

const initialExperienceForm: ExperienceFormState = {
  company: "",
  position: "",
  positionType: "",
  startDate: "",
  endDate: "",
  description: "",
};

export default function EducationExperienceTab() {
  const t = useTranslations("Onboarding.educationExperience");
  const tAlerts = useTranslations("Onboarding.alerts");
  const tEduAlerts = useTranslations("Onboarding.educationExperience.alerts");
  const { resumeData } = useOnboarding();
  const [educations, setEducations] = useState<UserEducationResponse[]>([]);
  const [educationForm, setEducationForm] =
    useState<EducationFormState>(initialEducationForm);
  const [educationErrors, setEducationErrors] = useState<EducationFormErrors>({});
  const [educationEditingIndex, setEducationEditingIndex] = useState<number | null>(null);
  const [experiences, setExperiences] = useState<UserExperienceResponse[]>([]);
  const [experienceForm, setExperienceForm] =
    useState<ExperienceFormState>(initialExperienceForm);
  const [experienceErrors, setExperienceErrors] =
    useState<ExperienceFormErrors>({});
  const [experienceEditingIndex, setExperienceEditingIndex] =
    useState<number | null>(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [isFetchingEducations, setIsFetchingEducations] = useState(false);
  const [isFetchingExperiences, setIsFetchingExperiences] = useState(false);
  const [isSavingEducation, setIsSavingEducation] = useState(false);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [isSavingAllDrafts, setIsSavingAllDrafts] = useState(false);

  const resetStatus = () => {
    if (status) {
      setStatus(null);
    }
  };

  // --- Auto-fill from AI ---
  useEffect(() => {
    if (resumeData?.education && resumeData.education.length > 0) {
      const newEducations: UserEducationResponse[] = resumeData.education.map((e) => ({
        school: e.school || "",
        degree: e.degree || "",
        major: e.major || null,
        start_date: e.startDate || "",
        end_date: e.endDate || "",
        description: e.description || "",
        user_id: "draft-ai", // Dummy ID
        created_at: null, // Flag as draft
        updated_at: null
      }));

      setEducations((prev) => {
        // Filter out items that might already exist by school name to avoid duplicates
        const existingSchools = new Set(prev.map(p => p.school.toLowerCase()));
        const filteredNew = newEducations.filter(e => !existingSchools.has(e.school.toLowerCase()));
        return [...prev, ...filteredNew];
      });
    }
  }, [resumeData, setEducations]); // Depend only on resumeData and setEducations

  useEffect(() => {
    if (resumeData?.experience && resumeData.experience.length > 0) {
      const newExperiences: UserExperienceResponse[] = resumeData.experience.map((e) => ({
        company: e.company || "",
        position: e.position || "",
        position_type: e.positionType || null,
        start_date: e.startDate || "",
        end_date: e.endDate || "",
        description: e.description || "",
        user_id: "draft-ai",
        created_at: null, // Flag as draft
        updated_at: null
      }));

      setExperiences((prev) => {
        const existingCompanies = new Set(prev.map(p => p.company.toLowerCase()));
        const filteredNew = newExperiences.filter(e => !existingCompanies.has(e.company.toLowerCase()));
        return [...prev, ...filteredNew];
      });
    }
  }, [resumeData, setExperiences]);

  const handleEducationFormChange = (
    field: keyof EducationFormState,
    value: string,
  ) => {
    setEducationForm((prev) => ({ ...prev, [field]: value }));
    setEducationErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    resetStatus();
  };

  const validateEducationForm = (): boolean => {
    const errors: EducationFormErrors = {};

    if (!educationForm.school.trim()) {
      errors.school = t("validation.school");
    }
    if (!educationForm.degree.trim()) {
      errors.degree = t("validation.degree");
    }
    if (!educationForm.startDate) {
      errors.startDate = t("validation.startDate");
    }
    if (!educationForm.endDate) {
      errors.endDate = t("validation.endDate");
    }
    if (educationForm.startDate && educationForm.endDate) {
      if (educationForm.startDate > educationForm.endDate) {
        errors.endDate = t("validation.dateOrder");
      }
    }

    setEducationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExperienceFormChange = (
    field: keyof ExperienceFormState,
    value: string,
  ) => {
    setExperienceForm((prev) => ({ ...prev, [field]: value }));
    setExperienceErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    resetStatus();
  };

  const validateExperienceForm = (): boolean => {
    const errors: ExperienceFormErrors = {};

    if (!experienceForm.company.trim()) {
      errors.company = t("validation.company");
    }
    if (!experienceForm.position.trim()) {
      errors.position = t("validation.position");
    }
    if (!experienceForm.startDate) {
      errors.startDate = t("validation.startDate");
    }
    if (!experienceForm.endDate) {
      errors.endDate = t("validation.endDate");
    }
    if (experienceForm.startDate && experienceForm.endDate) {
      if (experienceForm.startDate > experienceForm.endDate) {
        errors.endDate = t("validation.dateOrder");
      }
    }

    setExperienceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchEducations = useCallback(async () => {
    setIsFetchingEducations(true);
    try {
      const response = await userAPI.getEducations();
      if (response.ok && response.data) {
        setEducations((prev) => {
          // Merge logic: Keep draft items (created_at === null) and replace/append real items
          const drafts = prev.filter(item => item.created_at === null);
          // Avoid duplicates if user already saved some drafts
          const fetchedData = response.data || [];
          const fetchedSchools = new Set(fetchedData.map(e => e.school.toLowerCase()));

          // If draft has same school as fetched, assume it's already saved (or user should delete duplicate)
          // But usually we want to keep drafts that are NOT in DB yet.
          // For simplicity, just concatenate, user can delete duplicates.
          // Or smarter: filter drafts that are not in fetchedData
          const uniqueDrafts = drafts.filter(d => !fetchedSchools.has(d.school.toLowerCase()));

          return [...fetchedData, ...uniqueDrafts];
        });
      } else if (response.status !== 404) {
        const message =
          typeof response.data === "string"
            ? response.data
            : tEduAlerts("fetchEducationError");
        setStatus({
          type: "error",
          message,
        });
      }
    } catch (error) {
      console.error("Failed to fetch educations", error);
      setStatus({
        type: "error",
        message: tEduAlerts("fetchEducationError"),
      });
    } finally {
      setIsFetchingEducations(false);
    }
  }, []);

  const handleSaveAllDrafts = async () => {
    if (!confirm(t("aiDrafts.confirmSave"))) return;

    setIsSavingAllDrafts(true);
    resetStatus();

    const successItems: string[] = [];
    const failedItems: string[] = [];

    // Helper to handle dates: use existing or default to today
    const getSafeDate = (dateStr?: string | null) => {
      if (!dateStr) return new Date().toISOString().split('T')[0];
      return dateStr;
    };

    try {
      const draftEducations = educations.filter(e => e.created_at === null);
      const draftExperiences = experiences.filter(e => e.created_at === null);

      // Process Educations
      for (const edu of draftEducations) {
        const schoolName = edu.school || "ไม่ระบุชื่อสถาบัน";

        // Validate minimal requirements
        if (!edu.school || !edu.degree) {
          failedItems.push(`การศึกษา: ${schoolName} (ขาดชื่อสถาบันหรือวุฒิ)`);
          continue;
        }

        const payload: UserEducationPayload = {
          school: edu.school,
          degree: edu.degree,
          major: edu.major || null,
          start_date: getSafeDate(edu.start_date),
          end_date: getSafeDate(edu.end_date),
          description: edu.description || "",
        };

        try {
          const res = await userAPI.upsertEducation(payload);
          if (!res.ok) throw new Error(typeof res.data === 'string' ? res.data : 'Failed');
          successItems.push(`การศึกษา: ${schoolName}`);
        } catch (err) {
          console.error("Failed to save education:", err);
          failedItems.push(`การศึกษา: ${schoolName} (ระบบขัดข้อง)`);
        }
      }

      // Process Experiences
      for (const exp of draftExperiences) {
        const companyName = exp.company || "ไม่ระบุชื่อบริษัท";

        // Validate minimal requirements
        if (!exp.company || !exp.position) {
          failedItems.push(`งาน: ${companyName} (ขาดชื่อบริษัทหรือตำแหน่ง)`);
          continue;
        }

        const payload: UserExperiencePayload = {
          company: exp.company,
          position: exp.position,
          position_type: exp.position_type || null,
          start_date: getSafeDate(exp.start_date),
          end_date: getSafeDate(exp.end_date),
          description: exp.description || "",
        };

        try {
          const res = await userAPI.upsertExperience(payload);
          if (!res.ok) throw new Error(typeof res.data === 'string' ? res.data : 'Failed');
          successItems.push(`งาน: ${companyName}`);
        } catch (err) {
          console.error("Failed to save experience:", err);
          failedItems.push(`งาน: ${companyName} (ระบบขัดข้อง)`);
        }
      }

      await fetchEducations();
      await fetchExperiences();

      if (failedItems.length > 0) {
        const detailMsg = failedItems.join("\n");
        setStatus({
          type: "error",
          message: `${tEduAlerts("saveAllSuccess")} (${successItems.length}) / ${tAlerts("saveError")} (${failedItems.length}):\n${detailMsg}`
        });
      } else if (successItems.length > 0) {
        setStatus({ type: "success", message: tEduAlerts("saveAllSuccess") });
      } else {
        setStatus({ type: "info", message: tEduAlerts("noItemsToSave") });
      }

    } catch (error) {
      console.error("Failed to save drafts", error);
      setStatus({ type: "error", message: tAlerts("saveError") });
    } finally {
      setIsSavingAllDrafts(false);
    }
  };

  const handleAddEducation = async () => {
    resetStatus();
    if (!validateEducationForm()) {
      setStatus({
        type: "error",
        message: tAlerts("fillRequired"),
      });
      return;
    }

    setIsSavingEducation(true);
    try {
      const payload: UserEducationPayload = {
        school: educationForm.school.trim(),
        degree: educationForm.degree.trim(),
        major: educationForm.major.trim() || null,
        start_date: educationForm.startDate,
        end_date: educationForm.endDate,
        description: educationForm.description.trim(),
      };

      const response = await userAPI.upsertEducation(payload);

      if (!response.ok) {
        const message =
          typeof response.data === "string"
            ? response.data
            : tAlerts("saveError");
        throw new Error(message);
      }

      if (response.data) {
        await fetchEducations();
        setEducationForm(initialEducationForm);
        setEducationEditingIndex(null);
        setStatus({
          type: "success",
          message: tEduAlerts("saveEducationSuccess"),
        });
      }
    } catch (error) {
      console.error("Failed to save education", error);
      const message =
        error instanceof Error
          ? error.message
          : tAlerts("saveError");
      setStatus({ type: "error", message });
    } finally {
      setIsSavingEducation(false);
    }
  };

  const handleEditEducation = (index: number) => {
    const education = educations[index];
    setEducationForm({
      school: education.school,
      degree: education.degree,
      major: education.major || "",
      startDate: education.start_date,
      endDate: education.end_date,
      description: education.description,
    });
    setEducationEditingIndex(index);
  };

  const handleCancelEducationEdit = () => {
    setEducationForm(initialEducationForm);
    setEducationEditingIndex(null);
    setEducationErrors({});
  };

  const handleDeleteEducation = async (school: string, startDate: string) => {
    if (!confirm(tEduAlerts("deleteConfirm"))) {
      return;
    }

    // Check if it's a draft
    const edu = educations.find(e => e.school === school && e.start_date === startDate);
    if (edu && edu.created_at === null) {
      setEducations(prev => prev.filter(e => e !== edu));
      return;
    }

    setIsSavingEducation(true);
    try {
      const response = await userAPI.deleteEducation(school, startDate);

      if (!response.ok) {
        const message =
          typeof response.data === "string"
            ? response.data
            : tAlerts("saveError");
        throw new Error(message);
      }

      await fetchEducations();
      setStatus({
        type: "success",
        message: tEduAlerts("deleteEducationSuccess"),
      });
    } catch (error) {
      console.error("Failed to delete education", error);
      const message =
        error instanceof Error
          ? error.message
          : tAlerts("saveError");
      setStatus({ type: "error", message });
    } finally {
      setIsSavingEducation(false);
    }
  };

  const fetchExperiences = useCallback(async () => {
    setIsFetchingExperiences(true);
    try {
      const response = await userAPI.getExperiences();
      if (response.ok && response.data) {
        setExperiences((prev) => {
          const drafts = prev.filter(item => item.created_at === null);
          const fetchedData = response.data || [];
          const fetchedCompanies = new Set(fetchedData.map(e => e.company.toLowerCase()));
          const uniqueDrafts = drafts.filter(d => !fetchedCompanies.has(d.company.toLowerCase()));

          return [...fetchedData, ...uniqueDrafts];
        });
      } else if (response.status !== 404) {
        const message =
          typeof response.data === "string"
            ? response.data
            : tEduAlerts("fetchExperienceError");
        setStatus({
          type: "error",
          message,
        });
      }
    } catch (error) {
      console.error("Failed to fetch experiences", error);
      setStatus({
        type: "error",
        message: tEduAlerts("fetchExperienceError"),
      });
    } finally {
      setIsFetchingExperiences(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchEducations();
    fetchExperiences();
  }, [fetchEducations, fetchExperiences]);

  const handleAddExperience = async () => {
    resetStatus();
    if (!validateExperienceForm()) {
      setStatus({
        type: "error",
        message: tAlerts("fillRequired"),
      });
      return;
    }

    setIsSavingExperience(true);
    try {
      const payload: UserExperiencePayload = {
        company: experienceForm.company.trim(),
        position: experienceForm.position.trim(),
        position_type: experienceForm.positionType.trim() || null,
        start_date: experienceForm.startDate,
        end_date: experienceForm.endDate,
        description: experienceForm.description.trim(),
      };

      const response = await userAPI.upsertExperience(payload);

      if (!response.ok) {
        const message =
          typeof response.data === "string"
            ? response.data
            : tAlerts("saveError");
        throw new Error(message);
      }

      if (response.data) {
        await fetchExperiences();
        setExperienceForm(initialExperienceForm);
        setExperienceEditingIndex(null);
        setStatus({
          type: "success",
          message: tEduAlerts("saveExperienceSuccess"),
        });
      }
    } catch (error) {
      console.error("Failed to save experience", error);
      const message =
        error instanceof Error
          ? error.message
          : tAlerts("saveError");
      setStatus({ type: "error", message });
    } finally {
      setIsSavingExperience(false);
    }
  };

  const handleEditExperience = (index: number) => {
    const experience = experiences[index];
    setExperienceForm({
      company: experience.company,
      position: experience.position,
      positionType: experience.position_type || "",
      startDate: experience.start_date,
      endDate: experience.end_date,
      description: experience.description,
    });
    setExperienceEditingIndex(index);
  };

  const handleCancelExperienceEdit = () => {
    setExperienceForm(initialExperienceForm);
    setExperienceEditingIndex(null);
    setExperienceErrors({});
  };

  const handleDeleteExperience = async (company: string, startDate: string) => {
    if (!confirm(tEduAlerts("deleteConfirm"))) {
      return;
    }

    // Check if it's a draft
    const exp = experiences.find(e => e.company === company && e.start_date === startDate);
    if (exp && exp.created_at === null) {
      setExperiences(prev => prev.filter(e => e !== exp));
      return;
    }

    setIsSavingExperience(true);
    try {
      const response = await userAPI.deleteExperience(company, startDate);

      if (!response.ok) {
        const message =
          typeof response.data === "string"
            ? response.data
            : tAlerts("saveError");
        throw new Error(message);
      }

      await fetchExperiences();
      setStatus({
        type: "success",
        message: tEduAlerts("deleteExperienceSuccess"),
      });
    } catch (error) {
      console.error("Failed to delete experience", error);
      const message =
        error instanceof Error
          ? error.message
          : tAlerts("saveError");
      setStatus({ type: "error", message });
    } finally {
      setIsSavingExperience(false);
    }
  };

  const isBusyEducation = isFetchingEducations || isSavingEducation || isSavingAllDrafts;
  const isBusyExperience = isFetchingExperiences || isSavingExperience || isSavingAllDrafts;

  const hasDrafts = educations.some(e => e.created_at === null) || experiences.some(e => e.created_at === null);

  return (
    <Box>
      {status && (
        <Alert
          severity={status.type}
          sx={{
            mb: 3,
            borderRadius: 2,
            alignItems: "center",
            whiteSpace: "pre-wrap", // Allow newlines
          }}
        >
          {status.message}
        </Alert>
      )}

      {hasDrafts && (
        <Box sx={{ mb: 4, p: 2, bgcolor: "#f0f7ff", borderRadius: 2, border: "1px dashed #5c7aff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AutoFixHighIcon color="primary" />
            <Typography sx={{ color: "#222752", fontWeight: 500 }}>
              AI ได้เตรียมข้อมูลการศึกษาและประสบการณ์ไว้ให้คุณแล้ว
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveAllDrafts}
            disabled={isSavingAllDrafts}
          >
            {isSavingAllDrafts ? "กำลังบันทึก..." : "ยืนยันและบันทึกทั้งหมด"}
          </Button>
        </Box>
      )}

      {isFetchingEducations && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "#5c678f",
          }}
        >
          <CircularProgress size={18} thickness={5} />
          <Typography sx={{ color: "inherit", fontWeight: 500 }}>
            {tEduAlerts("loadingEducation")}
          </Typography>
        </Box>
      )}
      {isFetchingExperiences && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "#5c678f",
          }}
        >
          <CircularProgress size={18} thickness={5} />
          <Typography sx={{ color: "inherit", fontWeight: 500 }}>
            {tEduAlerts("loadingExperience")}
          </Typography>
        </Box>
      )}

      <Accordion
        defaultExpanded
        sx={{
          border: "1px solid rgba(143, 167, 255, 0.25)",
          borderRadius: 2,
          boxShadow: "none",
          bgcolor: "#fcfdff",
          "&.Mui-expanded": {
            boxShadow: "0 8px 24px rgba(73, 92, 136, 0.1)",
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{ px: 2, "& .MuiAccordionSummary-content": { gap: 1.5 } }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#222752" }}>
            {t("education.title")}
          </Typography>
          <Typography sx={{ color: "#757fa9" }}>
            {t("education.subtitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {educations.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{ fontSize: 16, fontWeight: 600, color: "#222752", mb: 2 }}
              >
                {t("education.listTitle")} ({educations.length})
              </Typography>
              <Stack spacing={2}>
                {educations.map((education, index) => (
                  <Paper
                    key={`${education.school}-${education.start_date}`}
                    sx={{
                      p: 2,
                      border: "1px solid rgba(143, 167, 255, 0.25)",
                      borderRadius: 2,
                      bgcolor: education.created_at === null ? "#f0f7ff" : "#ffffff", // Highlight draft items
                      borderColor: education.created_at === null ? "#5c7aff" : "rgba(143, 167, 255, 0.25)"
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            sx={{ fontSize: 18, fontWeight: 700, color: "#222752" }}
                          >
                            {education.school}
                          </Typography>
                          {education.created_at === null && (
                            <Chip
                              label={t("aiDrafts.recommended")}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<AutoFixHighIcon />}
                              sx={{ height: 24 }}
                            />
                          )}
                        </Stack>
                        <Typography
                          sx={{ fontSize: 14, color: "#5c678f", mt: 0.5 }}
                        >
                          {education.degree}
                          {education.major && ` - ${education.major}`}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 12, color: "#757fa9", mt: 1 }}
                        >
                          {education.start_date} - {education.end_date}
                        </Typography>
                        {education.description && (
                          <Typography
                            sx={{ fontSize: 13, color: "#2f3669", mt: 1 }}
                          >
                            {education.description}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditEducation(index)}
                          disabled={isBusyEducation}
                          sx={{ color: "#5c7aff" }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDeleteEducation(
                              education.school,
                              education.start_date,
                            )
                          }
                          disabled={isBusyEducation}
                          sx={{ color: "#f44336" }}
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: "#222752",
              mb: 2,
            }}
          >
            {educationEditingIndex !== null
              ? t("education.form.edit")
              : t("education.form.add")}
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={`${t("education.form.school")} *`}
                placeholder={t("education.form.enterSchool")}
                fullWidth
                slotProps={textFieldSlotProps}
                value={educationForm.school}
                onChange={(event) =>
                  handleEducationFormChange("school", event.target.value)
                }
                error={Boolean(educationErrors.school)}
                helperText={educationErrors.school}
                disabled={isBusyEducation}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={`${t("education.form.degree")} *`}
                placeholder={t("education.form.enterDegree")}
                fullWidth
                slotProps={textFieldSlotProps}
                value={educationForm.degree}
                onChange={(event) =>
                  handleEducationFormChange("degree", event.target.value)
                }
                error={Boolean(educationErrors.degree)}
                helperText={educationErrors.degree}
                disabled={isBusyEducation}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t("education.form.major")}
                placeholder={t("education.form.enterMajor")}
                fullWidth
                slotProps={textFieldSlotProps}
                value={educationForm.major}
                onChange={(event) =>
                  handleEducationFormChange("major", event.target.value)
                }
                disabled={isBusyEducation}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={`${t("education.form.startDate")} *`}
                type="date"
                fullWidth
                slotProps={textFieldSlotProps}
                InputLabelProps={{ shrink: true }}
                value={educationForm.startDate}
                onChange={(event) =>
                  handleEducationFormChange("startDate", event.target.value)
                }
                error={Boolean(educationErrors.startDate)}
                helperText={educationErrors.startDate}
                disabled={isBusyEducation}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={`${t("education.form.endDate")} *`}
                type="date"
                fullWidth
                slotProps={textFieldSlotProps}
                InputLabelProps={{ shrink: true }}
                value={educationForm.endDate}
                onChange={(event) =>
                  handleEducationFormChange("endDate", event.target.value)
                }
                error={Boolean(educationErrors.endDate)}
                helperText={educationErrors.endDate}
                disabled={isBusyEducation}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={t("education.form.description")}
                placeholder={t("education.form.enterDescription")}
                multiline
                rows={3}
                fullWidth
                slotProps={textFieldSlotProps}
                value={educationForm.description}
                onChange={(event) =>
                  handleEducationFormChange("description", event.target.value)
                }
                disabled={isBusyEducation}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleAddEducation}
              disabled={isBusyEducation}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.1,
                fontWeight: 600,
                bgcolor: "#5c7aff",
                "&:hover": { bgcolor: "#4c69f4" },
              }}
            >
              {educationEditingIndex !== null ? t("education.form.save") : t("education.form.add")}
            </Button>
            {educationEditingIndex !== null && (
              <Button
                variant="outlined"
                onClick={handleCancelEducationEdit}
                disabled={isBusyEducation}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.1,
                  fontWeight: 600,
                  borderColor: "rgba(71, 101, 254, 0.5)",
                  color: "#3146c8",
                  "&:hover": {
                    borderColor: "rgba(71, 101, 254, 0.8)",
                    bgcolor: "rgba(71, 101, 254, 0.08)",
                  },
                }}
              >
                {t("education.form.cancel")}
              </Button>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={{
          mt: 3,
          border: "1px solid rgba(143, 167, 255, 0.25)",
          borderRadius: 2,
          boxShadow: "none",
          bgcolor: "#fcfdff",
          "&.Mui-expanded": {
            boxShadow: "0 8px 24px rgba(73, 92, 136, 0.1)",
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{ px: 2, "& .MuiAccordionSummary-content": { gap: 1.5 } }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#222752" }}>
            ประสบการณ์ทำงาน
          </Typography>
          <Typography sx={{ color: "#757fa9" }}>
            {t("experience.subtitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {experiences.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{ fontSize: 16, fontWeight: 600, color: "#222752", mb: 2 }}
              >
                รายการประสบการณ์ ({experiences.length})
              </Typography>
              <Stack spacing={2}>
                {experiences.map((experience, index) => (
                  <Paper
                    key={`${experience.company}-${experience.start_date}`}
                    sx={{
                      p: 2,
                      border: "1px solid rgba(143, 167, 255, 0.25)",
                      borderRadius: 2,
                      bgcolor: experience.created_at === null ? "#f0f7ff" : "#ffffff",
                      borderColor: experience.created_at === null ? "#5c7aff" : "rgba(143, 167, 255, 0.25)"
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            sx={{ fontSize: 18, fontWeight: 700, color: "#222752" }}
                          >
                            {experience.company}
                          </Typography>
                          {experience.created_at === null && (
                            <Chip
                              label={t("aiDrafts.recommended")}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<AutoFixHighIcon />}
                              sx={{ height: 24 }}
                            />
                          )}
                        </Stack>
                        <Typography
                          sx={{ fontSize: 14, color: "#5c678f", mt: 0.5 }}
                        >
                          {experience.position}
                          {experience.position_type &&
                            ` - ${experience.position_type}`}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 12, color: "#757fa9", mt: 1 }}
                        >
                          {experience.start_date} - {experience.end_date}
                        </Typography>
                        {experience.description && (
                          <Typography
                            sx={{ fontSize: 13, color: "#2f3669", mt: 1 }}
                          >
                            {experience.description}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditExperience(index)}
                          disabled={isBusyExperience}
                          sx={{ color: "#5c7aff" }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDeleteExperience(
                              experience.company,
                              experience.start_date,
                            )
                          }
                          disabled={isBusyExperience}
                          sx={{ color: "#f44336" }}
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: "#222752",
              mb: 2,
            }}
          >
            {experienceEditingIndex !== null
              ? t("experience.form.edit")
              : t("experience.form.add")}
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={`${t("experience.form.company")} *`}
                placeholder={t("experience.form.enterCompany")}
                fullWidth
                slotProps={textFieldSlotProps}
                value={experienceForm.company}
                onChange={(event) =>
                  handleExperienceFormChange("company", event.target.value)
                }
                error={Boolean(experienceErrors.company)}
                helperText={experienceErrors.company}
                disabled={isBusyExperience}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={`${t("experience.form.position")} *`}
                placeholder={t("experience.form.enterPosition")}
                fullWidth
                slotProps={textFieldSlotProps}
                value={experienceForm.position}
                onChange={(event) =>
                  handleExperienceFormChange("position", event.target.value)
                }
                error={Boolean(experienceErrors.position)}
                helperText={experienceErrors.position}
                disabled={isBusyExperience}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t("experience.form.positionType")}
                placeholder={t("experience.form.enterPositionType")}
                fullWidth
                slotProps={textFieldSlotProps}
                value={experienceForm.positionType}
                onChange={(event) =>
                  handleExperienceFormChange("positionType", event.target.value)
                }
                disabled={isBusyExperience}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={`${t("experience.form.startDate")} *`}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={textFieldSlotProps}
                value={experienceForm.startDate}
                onChange={(event) =>
                  handleExperienceFormChange("startDate", event.target.value)
                }
                error={Boolean(experienceErrors.startDate)}
                helperText={experienceErrors.startDate}
                disabled={isBusyExperience}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={`${t("experience.form.endDate")} *`}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={textFieldSlotProps}
                value={experienceForm.endDate}
                onChange={(event) =>
                  handleExperienceFormChange("endDate", event.target.value)
                }
                error={Boolean(experienceErrors.endDate)}
                helperText={experienceErrors.endDate}
                disabled={isBusyExperience}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={t("experience.form.description")}
                placeholder={t("experience.form.enterDescription")}
                multiline
                rows={4}
                fullWidth
                slotProps={textFieldSlotProps}
                value={experienceForm.description}
                onChange={(event) =>
                  handleExperienceFormChange("description", event.target.value)
                }
                disabled={isBusyExperience}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleAddExperience}
              disabled={isBusyExperience}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.1,
                fontWeight: 600,
                bgcolor: "#5c7aff",
                "&:hover": { bgcolor: "#4c69f4" },
              }}
            >
              {experienceEditingIndex !== null
                ? `${t("experience.form.save")}`
                : t("experience.form.add")}
            </Button>
            {experienceEditingIndex !== null && (
              <Button
                variant="outlined"
                onClick={handleCancelExperienceEdit}
                disabled={isBusyExperience}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.1,
                  fontWeight: 600,
                  borderColor: "rgba(71, 101, 254, 0.5)",
                  color: "#3146c8",
                  "&:hover": {
                    borderColor: "rgba(71, 101, 254, 0.8)",
                    bgcolor: "rgba(71, 101, 254, 0.08)",
                  },
                }}
              >
                {t("experience.form.cancel")}
              </Button>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
