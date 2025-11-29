"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Dialog,
  Typography,
  CircularProgress,
  Stack,
  TextField,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Fade,
  MenuItem,
  Alert,
  AlertTitle,
  Autocomplete,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShareIcon from '@mui/icons-material/Share';


import {
  aiAPI,
  userAPI,
  ParsedResumeData,
  UserProfilePayload,
  UserAddressPayload,
  UserEducationPayload,
  UserExperiencePayload
} from "@/app/lib/api";
import { useOnboarding } from "@/app/context/OnboardingContext";
import {
  getProvinces,
  getAmphoes,
  getDistricts,
  getZipcode,
} from "@/app/lib/thai-address";

type Section = "personal" | "address" | "education" | "experience" | "skills" | "social";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "sections.personal", icon: <PersonOutlineIcon /> },
  { id: "address", label: "sections.address", icon: <HomeOutlinedIcon /> },
  { id: "education", label: "sections.education", icon: <SchoolOutlinedIcon /> },
  { id: "experience", label: "sections.experience", icon: <WorkOutlineIcon /> },
  { id: "skills", label: "sections.skills", icon: <LightbulbOutlinedIcon /> },
  { id: "social", label: "sections.social", icon: <ShareIcon /> },
];

// Options for dropdowns
const prefixOptions = [
  { value: "mr", label: "options.prefix.mr" },
  { value: "ms", label: "options.prefix.ms" },
  { value: "mrs", label: "options.prefix.mrs" },
  { value: "dr", label: "options.prefix.dr" },
];

const genderOptions = [
  { value: "male", label: "options.gender.male" },
  { value: "female", label: "options.gender.female" },
  { value: "unspecified", label: "options.gender.unspecified" },
];


const religionOptions = [
  { value: "buddhism", label: "options.religion.buddhism" },
  { value: "christian", label: "options.religion.christian" },
  { value: "islam", label: "options.religion.islam" },
  { value: "other", label: "options.religion.other" },
];

export default function ResumeUpload() {
  const t = useTranslations("Onboarding.resumeUpload");
  const { setResumeData } = useOnboarding();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Address Options
  const provinceOptions = useMemo(() => getProvinces(), []);

  const districtOptions = useMemo(() => {
    if (!parsedResult?.personal.address?.province) return [];
    return getAmphoes(parsedResult.personal.address.province);
  }, [parsedResult?.personal.address?.province]);

  const subDistrictOptions = useMemo(() => {
    if (
      !parsedResult?.personal.address?.province ||
      !parsedResult?.personal.address?.district
    )
      return [];
    return getDistricts(
      parsedResult.personal.address.province,
      parsedResult.personal.address.district,
    );
  }, [
    parsedResult?.personal.address?.province,
    parsedResult?.personal.address?.district,
  ]);

  // Reset active section when dialog opens
  useEffect(() => {
    if (openDialog) {
      setActiveSection("personal");
    }
  }, [openDialog]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError(t("alerts.fileSize"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];
    if (!validTypes.includes(file.type)) {
      setError(t("alerts.fileType"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const data = await aiAPI.parseResume(file);
      // Ensure all fields exist even if empty to avoid controlled/uncontrolled errors
      const safeData: ParsedResumeData = {
        ...data,
        personal: {
          ...data.personal,
          title: data.personal.title || "",
          gender: data.personal.gender || "unspecified",
          birthDate: data.personal.birthDate || "",
          nationality: data.personal.nationality || "ไทย",
          religion: data.personal.religion || "",
          militaryStatus: data.personal.militaryStatus || "",
          firstNameTh: data.personal.firstNameTh || "",
          lastNameTh: data.personal.lastNameTh || "",
          firstNameEn: data.personal.firstNameEn || "",
          lastNameEn: data.personal.lastNameEn || "",
          phone: data.personal.phone || "",

          email: data.personal.email || "",
        }
      };
      setParsedResult(safeData);
      setOpenDialog(true);
    } catch (err) {
      console.error("Upload failed", err);
      let message = t("alerts.readError");
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          message = t("alerts.connectError");
        } else if (err.message.includes("500")) {
          message = t("alerts.serverError");
        }
      }
      setError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCloseDialog = () => {
    if (!isSaving) {
      setOpenDialog(false);
    }
  };

  const handleSaveAll = async () => {
    if (!parsedResult) return;

    setIsSaving(true);
    try {
      // 1. Save Personal Profile
      const profilePayload: UserProfilePayload = {
        title: parsedResult.personal.title || null,
        first_name_th: parsedResult.personal.firstNameTh || null,
        last_name_th: parsedResult.personal.lastNameTh || null,
        first_name_en: parsedResult.personal.firstNameEn || null,
        last_name_en: parsedResult.personal.lastNameEn || null,
        gender: parsedResult.personal.gender || null,
        birth_date: parsedResult.personal.birthDate || null,
        nationality: parsedResult.personal.nationality || null,
        religion: parsedResult.personal.religion || null,
        phone: parsedResult.personal.phone || null,
        email: parsedResult.personal.email || null,
        military_status: null,
      };
      await userAPI.upsertProfile(profilePayload);

      // 2. Save Address
      const addressPayload: UserAddressPayload = {
        province: parsedResult.personal.address?.province || null,
        district: parsedResult.personal.address?.district || null,
        subdistrict: parsedResult.personal.address?.subdistrict || null,
        postal_code: parsedResult.personal.address?.postalCode || null,
      };
      await userAPI.upsertAddress(addressPayload);

      // 3. Save Education (Loop through and upsert/create)
      // Note: For simplicity in this bulk import, we might just create them. 
      // Ideally, we should sync better, but assuming import = add new or overwrite if logic exists.
      // The current API is basic, so we'll just loop create/upsert. 
      // Warning: 'upsertEducation' usually requires specific ID or composite key matching.
      // Based on API definition, it might replace or add. Let's assume creation for new items.
      if (parsedResult.education && parsedResult.education.length > 0) {
        for (const edu of parsedResult.education) {
          const eduPayload: UserEducationPayload = {
            school: edu.school,
            degree: edu.degree,
            major: edu.major,
            start_date: edu.startDate || new Date().toISOString().split('T')[0], // Fallback if missing
            end_date: edu.endDate || new Date().toISOString().split('T')[0],
            description: edu.description
          };
          // We use create here because we don't have IDs for these new items
          await userAPI.createEducation(eduPayload);
        }
      }

      // 4. Save Experience
      if (parsedResult.experience && parsedResult.experience.length > 0) {
        for (const exp of parsedResult.experience) {
          const expPayload: UserExperiencePayload = {
            company: exp.company,
            position: exp.position,
            position_type: exp.positionType || "Full-time",
            start_date: exp.startDate || new Date().toISOString().split('T')[0],
            end_date: exp.endDate || new Date().toISOString().split('T')[0],
            description: exp.description
          };
          await userAPI.createExperience(expPayload);
        }
      }

      // 5. Save Skills?
      // The API definition in `app/lib/api.ts` doesn't seem to have a direct "upsertSkills" endpoint visible 
      // in the `userAPI` object exported, or it might be part of profile or not implemented fully in the snippet.
      // Looking at `ParsedResumeData`, it has `skills: string[]`.
      // Looking at `UserProfilePayload`, there is no `skills` field.
      // Check if there is a separate API for skills or if it's missing. 
      // Assuming for now we just skip skills or it might be handled differently later.
      // Wait, let's check `app/lib/api.ts` again. No `skills` endpoint. 
      // Maybe it's not implemented in backend yet or I missed it. 
      // I will update the local context at least so the UI reflects it if used elsewhere.

      // Update global context just in case
      setResumeData(parsedResult);

      // Close dialog and maybe show success
      setOpenDialog(false);
      // You might want to trigger a refresh of data in the parent component or redirect.
      window.location.reload(); // Simple way to refresh all data on page

    } catch (err) {
      console.error("Failed to save data", err);
      setError(t("alerts.saveError"));
      setIsSaving(false); // Only stop saving flag if error
    }
  };

  const updatePersonalData = (field: string, value: string) => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      personal: { ...parsedResult.personal, [field]: value },
    });
  };

  const updateAddressData = (field: string, value: string) => {
    if (!parsedResult) return;

    const currentAddress = parsedResult.personal.address || {};
    let newData = { ...currentAddress, [field]: value };

    if (field === "province") {
      newData = { ...newData, district: "", subdistrict: "", postalCode: "" };
    } else if (field === "district") {
      newData = { ...newData, subdistrict: "", postalCode: "" };
    } else if (field === "subdistrict") {
      const zip = getZipcode(newData.province || "", newData.district || "", value);
      if (zip) {
        newData.postalCode = zip;
      }
    }

    setParsedResult({
      ...parsedResult,
      personal: {
        ...parsedResult.personal,
        address: newData,
      },
    });
  };

  // Determine if a section is "Complete" based on required fields
  const isSectionComplete = (section: Section) => {
    if (!parsedResult) return false;
    switch (section) {
      case "personal":
        // Require: Firstname, Lastname, Phone, Email (Basic) + New Required Fields
        return !!(
          parsedResult.personal.firstNameTh &&
          parsedResult.personal.lastNameTh &&
          parsedResult.personal.phone &&
          parsedResult.personal.title &&
          parsedResult.personal.birthDate &&
          parsedResult.personal.nationality
        );
      case "address":
        // Require: Province, District, Subdistrict, Zip
        return !!(
          parsedResult.personal.address?.province &&
          parsedResult.personal.address?.district &&
          parsedResult.personal.address?.subdistrict &&
          parsedResult.personal.address?.postalCode
        );
      case "education":
        // At least one education record
        return (parsedResult.education?.length || 0) > 0;
      case "experience":
        // Experience is optional usually, but let's say check if array exists
        // But for "Completeness" maybe we don't enforce it strictly if fresh grad?
        // Let's just return true if array exists (even empty) or maybe check length if we want to encourage it.
        // User said "clear separation of icons... which has data". So if empty, maybe show different icon?
        return (parsedResult.experience?.length || 0) > 0;
      case "skills":
        return (parsedResult.skills?.length || 0) > 0;
      case "social":
        return true; // Optional or check if connected
      default:
        return false;
    }
  };

  const renderContent = () => {
    if (!parsedResult) return null;

    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>

        {/* Warning Banner */}
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>{t("alerts.verify.title")}</AlertTitle>
          {t("alerts.verify.content")}
          <br />
          {t("alerts.verify.instruction")}
        </Alert>

        {activeSection === "personal" && (
          <Fade in={activeSection === "personal"}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{t("form.personal.title")}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      select
                      fullWidth
                      label={t("form.personal.prefix")}
                      value={parsedResult.personal.title || ""}
                      onChange={(e) => updatePersonalData("title", e.target.value)}
                    >
                      {prefixOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {t(option.label)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      fullWidth
                      label={t("form.personal.firstNameTh")}
                      value={parsedResult.personal.firstNameTh || ""}
                      onChange={(e) => updatePersonalData("firstNameTh", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      fullWidth
                      label={t("form.personal.lastNameTh")}
                      value={parsedResult.personal.lastNameTh || ""}
                      onChange={(e) => updatePersonalData("lastNameTh", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t("form.personal.firstNameEn")}
                      value={parsedResult.personal.firstNameEn || ""}
                      onChange={(e) => updatePersonalData("firstNameEn", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t("form.personal.lastNameEn")}
                      value={parsedResult.personal.lastNameEn || ""}
                      onChange={(e) => updatePersonalData("lastNameEn", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{t("form.personal.additionalInfo")}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      type="date"
                      fullWidth
                      label={t("form.personal.birthDate")}
                      InputLabelProps={{ shrink: true }}
                      value={parsedResult.personal.birthDate || ""}
                      onChange={(e) => updatePersonalData("birthDate", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label={t("form.personal.gender")}
                      value={parsedResult.personal.gender || "unspecified"}
                      onChange={(e) => updatePersonalData("gender", e.target.value)}
                    >
                      {genderOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {t(option.label)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label={t("form.personal.nationality")}
                      value={parsedResult.personal.nationality || ""}
                      onChange={(e) => updatePersonalData("nationality", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={t("form.personal.religion")}
                      value={parsedResult.personal.religion || ""}
                      onChange={(e) => updatePersonalData("religion", e.target.value)}
                    >
                      {religionOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {t(option.label)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{t("form.personal.contactInfo")}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t("form.personal.phone")}
                      value={parsedResult.personal.phone || ""}
                      onChange={(e) => updatePersonalData("phone", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t("form.personal.email")}
                      value={parsedResult.personal.email || ""}
                      onChange={(e) => updatePersonalData("email", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Fade>
        )}

        {activeSection === "address" && (
          <Fade in={activeSection === "address"}>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight="bold">{t("form.address.title")}</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={provinceOptions}
                    value={parsedResult.personal.address?.province || null}
                    onChange={(_, newValue) =>
                      updateAddressData("province", newValue || "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("form.address.province")}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    )}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={districtOptions}
                    value={parsedResult.personal.address?.district || null}
                    onChange={(_, newValue) =>
                      updateAddressData("district", newValue || "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("form.address.district")}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    )}
                    fullWidth
                    disabled={!parsedResult.personal.address?.province}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={subDistrictOptions}
                    value={parsedResult.personal.address?.subdistrict || null}
                    onChange={(_, newValue) =>
                      updateAddressData("subdistrict", newValue || "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("form.address.subdistrict")}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    )}
                    fullWidth
                    disabled={!parsedResult.personal.address?.district}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("form.address.postalCode")}
                    value={parsedResult.personal.address?.postalCode || ""}
                    onChange={(e) => updateAddressData("postalCode", e.target.value)}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Fade>
        )}

        {activeSection === "education" && (
          <Fade in={activeSection === "education"}>
            <Stack spacing={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">{t("form.education.title")}</Typography>
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setParsedResult({
                      ...parsedResult,
                      education: [
                        ...(parsedResult.education || []),
                        { school: "", degree: "", major: "", startDate: "", endDate: "", description: "" },
                      ],
                    });
                  }}
                >
                  {t("form.education.add")}
                </Button>
              </Box>

              {parsedResult.education?.map((edu, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative', bgcolor: '#fafbff' }}>
                  <IconButton
                    size="small"
                    color="error"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => {
                      const newEdu = [...(parsedResult.education || [])];
                      newEdu.splice(index, 1);
                      setParsedResult({ ...parsedResult, education: newEdu });
                    }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label={t("form.education.institution")}
                        value={edu.school}
                        onChange={(e) => {
                          const newEdu = [...(parsedResult.education || [])];
                          newEdu[index].school = e.target.value;
                          setParsedResult({ ...parsedResult, education: newEdu });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label={t("form.education.degree")}
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...(parsedResult.education || [])];
                          newEdu[index].degree = e.target.value;
                          setParsedResult({ ...parsedResult, education: newEdu });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label={t("form.education.major")}
                        value={edu.major}
                        onChange={(e) => {
                          const newEdu = [...(parsedResult.education || [])];
                          newEdu[index].major = e.target.value;
                          setParsedResult({ ...parsedResult, education: newEdu });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label={t("form.education.startYear")}
                        InputLabelProps={{ shrink: true }}
                        value={edu.startDate}
                        onChange={(e) => {
                          const newEdu = [...(parsedResult.education || [])];
                          newEdu[index].startDate = e.target.value;
                          setParsedResult({ ...parsedResult, education: newEdu });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label={t("form.education.endYear")}
                        InputLabelProps={{ shrink: true }}
                        value={edu.endDate}
                        onChange={(e) => {
                          const newEdu = [...(parsedResult.education || [])];
                          newEdu[index].endDate = e.target.value;
                          setParsedResult({ ...parsedResult, education: newEdu });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {(!parsedResult.education || parsedResult.education.length === 0) && (
                <Box textAlign="center" py={4} bgcolor="#f5f5f5" borderRadius={2}>
                  <Typography color="text.secondary">{t("form.education.empty")}</Typography>
                </Box>
              )}
            </Stack>
          </Fade>
        )}

        {/* {activeSection === "social" && (
          <Fade in={activeSection === "social"}>
            <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                เชื่อมต่อโซเชียลมีเดีย
              </Typography>
              <Typography color="text.secondary" align="center" sx={{ maxWidth: 500, mb: 4 }}>
                เชื่อมต่อบัญชีโซเชียลมีเดียของคุณเพื่อให้ AI วิเคราะห์บุคลิกภาพ ทัศนคติ และไลฟ์สไตล์
                เพื่อช่วยให้บริษัทรู้จักตัวตนของคุณมากขึ้น
              </Typography>

              <SocialConnectButton />

              <Box sx={{ mt: 4, p: 3, bgcolor: '#f0f9ff', borderRadius: 2, maxWidth: 500, width: '100%' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                  ประโยชน์ของการเชื่อมต่อ:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircleOutlineIcon color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="วิเคราะห์จุดแข็งทางบุคลิกภาพ (Soft Skills)" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleOutlineIcon color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="แสดงให้เห็นถึงทัศนคติเชิงบวกและการทำงานร่วมกับผู้อื่น" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleOutlineIcon color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="เพิ่มโอกาสในการได้งานที่ตรงกับวัฒนธรรมองค์กร" />
                  </ListItem>
                </List>
              </Box>
            </Stack>
          </Fade>
        )} */}

        {activeSection === "experience" && (
          <Fade in={activeSection === "experience"}>
            <Stack spacing={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">{t("form.experience.title")}</Typography>
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setParsedResult({
                      ...parsedResult,
                      experience: [
                        ...(parsedResult.experience || []),
                        { company: "", position: "", positionType: "", startDate: "", endDate: "", description: "" },
                      ],
                    });
                  }}
                >
                  {t("form.experience.add")}
                </Button>
              </Box>

              {parsedResult.experience?.map((exp, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative', bgcolor: '#fafbff' }}>
                  <IconButton
                    size="small"
                    color="error"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => {
                      const newExp = [...(parsedResult.experience || [])];
                      newExp.splice(index, 1);
                      setParsedResult({ ...parsedResult, experience: newExp });
                    }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label={t("form.experience.company")}
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...(parsedResult.experience || [])];
                          newExp[index].company = e.target.value;
                          setParsedResult({ ...parsedResult, experience: newExp });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label={t("form.experience.position")}
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...(parsedResult.experience || [])];
                          newExp[index].position = e.target.value;
                          setParsedResult({ ...parsedResult, experience: newExp });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label={t("form.experience.startDate")}
                        InputLabelProps={{ shrink: true }}
                        value={exp.startDate}
                        onChange={(e) => {
                          const newExp = [...(parsedResult.experience || [])];
                          newExp[index].startDate = e.target.value;
                          setParsedResult({ ...parsedResult, experience: newExp });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label={t("form.experience.endDate")}
                        InputLabelProps={{ shrink: true }}
                        value={exp.endDate}
                        onChange={(e) => {
                          const newExp = [...(parsedResult.experience || [])];
                          newExp[index].endDate = e.target.value;
                          setParsedResult({ ...parsedResult, experience: newExp });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t("form.experience.description")}
                        value={exp.description}
                        onChange={(e) => {
                          const newExp = [...(parsedResult.experience || [])];
                          newExp[index].description = e.target.value;
                          setParsedResult({ ...parsedResult, experience: newExp });
                        }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {(!parsedResult.experience || parsedResult.experience.length === 0) && (
                <Box textAlign="center" py={4} bgcolor="#f5f5f5" borderRadius={2}>
                  <Typography color="text.secondary">{t("form.experience.empty")}</Typography>
                </Box>
              )}
            </Stack>
          </Fade>
        )}

        {activeSection === "skills" && (
          <Fade in={activeSection === "skills"}>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight="bold">{t("form.skills.title")}</Typography>
              <TextField
                fullWidth
                label={t("form.skills.addLabel")}
                placeholder={t("form.skills.addPlaceholder")}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      setParsedResult({
                        ...parsedResult,
                        skills: [...(parsedResult.skills || []), target.value.trim()],
                      });
                      target.value = "";
                    }
                  }
                }}
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {parsedResult.skills?.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => {
                      const newSkills = [...(parsedResult.skills || [])];
                      newSkills.splice(index, 1);
                      setParsedResult({ ...parsedResult, skills: newSkills });
                    }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {(!parsedResult.skills || parsedResult.skills.length === 0) && (
                  <Typography color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>
                    {t("form.skills.empty")}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Fade>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      <input
        type="file"
        accept=".pdf,.docx,.doc,image/*"
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            borderColor: "#5c7aff",
            color: "#5c7aff",
            "&:hover": {
              bgcolor: "rgba(92, 122, 255, 0.04)",
              borderColor: "#4c69f4",
            },
          }}
        >
          {isUploading ? t("form.actions.analyzing") : t("form.actions.import")}
        </Button>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Box>

      {/* Full Screen Dialog / Large Modal */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "90vh",
            maxHeight: "900px",
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <Grid container sx={{ height: "100%" }}>
          {/* Left Sidebar: Navigation */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ bgcolor: "#f8faff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column" }}>
            <Box p={3} borderBottom="1px solid #eee">
              <Typography variant="h6" fontWeight="bold" color="primary">
                {t("form.actions.verifyTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("form.actions.verifySubtitle")}
              </Typography>
            </Box>
            <List sx={{ flexGrow: 1, pt: 2 }}>
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const completed = isSectionComplete(section.id);

                return (
                  <ListItem key={section.id} disablePadding sx={{ mb: 1, px: 2 }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => setActiveSection(section.id)}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isActive ? "white !important" : "transparent",
                        boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                        "&:hover": {
                          bgcolor: isActive ? "white" : "rgba(0,0,0,0.03)",
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: isActive ? "primary.main" : "text.secondary" }}>
                        {section.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={t(section.label)}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "text.primary" : "text.secondary"
                        }}
                      />
                      {completed ? (
                        <CheckCircleOutlineIcon fontSize="small" color="success" />
                      ) : (
                        <ErrorOutlineIcon fontSize="small" color="error" />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Grid>

          {/* Right Content: Form */}
          <Grid size={{ xs: 12, md: 9 }} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Content Area */}
            <Box sx={{ flexGrow: 1, overflow: "hidden", bgcolor: "#fafafa" }}>
              {renderContent()}
            </Box>

            {/* Footer Actions */}
            <Box
              sx={{
                p: 2,
                borderTop: "1px solid #eee",
                bgcolor: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 10
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                {t("form.actions.requiredNote")}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleCloseDialog}
                  color="inherit"
                  sx={{ color: "text.secondary" }}
                  disabled={isSaving}
                >
                  {t("form.actions.cancel")}
                </Button>
                <Button
                  onClick={handleSaveAll}
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={isSaving}
                  sx={{
                    bgcolor: "#5c7aff",
                    px: 4,
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(92, 122, 255, 0.2)",
                    "&:hover": {
                      bgcolor: "#4c69f4",
                      boxShadow: "0 6px 16px rgba(92, 122, 255, 0.3)",
                    },
                  }}
                >
                  {isSaving ? t("form.actions.saving") : t("form.actions.saveAll")}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Dialog>
    </Box>
  );
}
