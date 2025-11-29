"use client";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Autocomplete,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  userAPI,
  type UserProfilePayload,
  type UserProfileResponse,
  type UserAddressPayload,
  type UserAddressResponse,
  type UserJobPreferencePayload,
  type UserJobPreferenceResponse,
} from "@/app/lib/api";
import { useOnboarding } from "@/app/context/OnboardingContext";
import {
  getProvinces,
  getAmphoes,
  getDistricts,
  getZipcode,
} from "@/app/lib/thai-address";
import ResumeUpload from "./ResumeUpload";
import { industries } from "@/app/lib/industry-data";

type GenderOption = "male" | "female" | "unspecified";
interface PersonalFormState {
  title: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: GenderOption;
  birthDate: string;
  nationality: string;
  religion: string;
  email: string;
  phone: string;
}

type PersonalFormErrors = Partial<Record<keyof PersonalFormState, string>>;

interface AddressFormState {
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

type AddressFormErrors = Partial<Record<keyof AddressFormState, string>>;

interface JobPreferenceFormState {
  id?: string;
  industry: string;
  position: string;
  workTime: string;
}

type JobPreferenceFormErrors = Partial<Record<keyof JobPreferenceFormState, string>>;

type StatusState =
  | {
    type: "success" | "error";
    message: string;
  }
  | null;

type RequiredFieldName =
  | "title"
  | "firstNameTh"
  | "lastNameTh"
  | "firstNameEn"
  | "lastNameEn"
  | "birthDate"
  | "nationality"
  | "phone";



const initialFormState: PersonalFormState = {
  title: "",
  firstNameTh: "",
  lastNameTh: "",
  firstNameEn: "",
  lastNameEn: "",
  gender: "unspecified",
  birthDate: "",
  nationality: "",
  religion: "",
  email: "",
  phone: "",
};

const initialAddressState: AddressFormState = {
  province: "",
  district: "",
  subdistrict: "",
  postalCode: "",
};

const initialJobPreferenceState: JobPreferenceFormState = {
  industry: "",
  position: "",
  workTime: "",
};

const normalizeText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const mapProfileToFormState = (
  profile: UserProfileResponse,
): PersonalFormState => ({
  title: profile.title ?? "",
  firstNameTh: profile.first_name_th ?? "",
  lastNameTh: profile.last_name_th ?? "",
  firstNameEn: profile.first_name_en ?? "",
  lastNameEn: profile.last_name_en ?? "",
  gender:
    profile.gender === "male" ||
      profile.gender === "female" ||
      profile.gender === "unspecified"
      ? profile.gender
      : "unspecified",
  birthDate: profile.birth_date ?? "",
  nationality: profile.nationality ?? "",
  religion: profile.religion ?? "",
  email: profile.email ?? "",
  phone: profile.phone ?? "",
});

const buildProfilePayload = (
  data: PersonalFormState,
  imageUrls?: { profile_image_url?: string | null; cover_image_url?: string | null },
): UserProfilePayload => {
  // Get image URLs from localStorage if not provided
  let profileImageUrl: string | null = null;
  let coverImageUrl: string | null = null;

  if (imageUrls) {
    profileImageUrl = imageUrls.profile_image_url ?? null;
    coverImageUrl = imageUrls.cover_image_url ?? null;
  } else if (typeof window !== "undefined") {
    const savedProfileImage = localStorage.getItem("profile_image_url");
    const savedCoverImage = localStorage.getItem("cover_image_url");
    profileImageUrl = savedProfileImage || null;
    coverImageUrl = savedCoverImage || null;
  }

  return {
    title: normalizeText(data.title),
    first_name_th: normalizeText(data.firstNameTh),
    last_name_th: normalizeText(data.lastNameTh),
    first_name_en: normalizeText(data.firstNameEn),
    last_name_en: normalizeText(data.lastNameEn),
    gender: data.gender,
    birth_date: data.birthDate || null,
    religion: normalizeText(data.religion),
    nationality: normalizeText(data.nationality),
    phone: normalizeText(data.phone),
    email: normalizeText(data.email),
    military_status: null,
    is_disabled: null,
    profile_image_url: profileImageUrl,
    cover_image_url: coverImageUrl,
  };
};

const mapAddressToFormState = (
  address: UserAddressResponse,
): AddressFormState => ({
  province: address.province ?? "",
  district: address.district ?? "",
  subdistrict: address.subdistrict ?? "",
  postalCode: address.postal_code ?? "",
});

const buildAddressPayload = (
  data: AddressFormState,
): UserAddressPayload => ({
  province: normalizeText(data.province),
  district: normalizeText(data.district),
  subdistrict: normalizeText(data.subdistrict),
  postal_code: normalizeText(data.postalCode),
  address_detail: null,
});

const mapJobPreferenceToFormState = (
  preference: UserJobPreferenceResponse,
): JobPreferenceFormState => ({
  id: preference.id,
  industry: (preference as any).industry ?? "",
  position: preference.position ?? "",
  workTime: preference.work_time ?? "",
});

const buildJobPreferencePayload = (
  data: JobPreferenceFormState,
): UserJobPreferencePayload => ({
  industry: data.industry,
  position: data.position.trim() || "",
  work_time: normalizeText(data.workTime),
} as any);

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

const radioControlSx = {
  color: "#8290c5",
  "&.Mui-checked": {
    color: "#3762ff",
  },
};

const radioLabelSx = {
  "& .MuiTypography-root": {
    color: "#2f3669",
    fontWeight: 600,
  },
};

export default function PersonalInformationTab() {
  const t = useTranslations("Onboarding.personal");
  const tAlerts = useTranslations("Onboarding.alerts");
  const { setName, resumeData } = useOnboarding();

  const REQUIRED_FIELD_MESSAGES: Record<RequiredFieldName, string> = useMemo(() => ({
    title: t("validation.required.prefix"),
    firstNameTh: t("validation.required.firstNameTh"),
    lastNameTh: t("validation.required.lastNameTh"),
    firstNameEn: t("validation.required.firstNameEn"),
    lastNameEn: t("validation.required.lastNameEn"),
    birthDate: t("validation.required.birthDate"),
    nationality: t("validation.required.nationality"),
    phone: t("validation.required.phone"),
  }), [t]);

  const prefixOptions = useMemo(() => [
    { value: "mr", label: t("options.prefix.mr") },
    { value: "ms", label: t("options.prefix.ms") },
    { value: "mrs", label: t("options.prefix.mrs") },
    { value: "dr", label: t("options.prefix.dr") },
  ], [t]);

  const religionOptions = useMemo(() => [
    { value: "buddhism", label: t("options.religion.buddhism") },
    { value: "christian", label: t("options.religion.christian") },
    { value: "islam", label: t("options.religion.islam") },
    { value: "other", label: t("options.religion.other") },
  ], [t]);

  const availabilityOptions = useMemo(() => [
    { value: "immediate", label: t("options.availability.immediate") },
    { value: "30days", label: t("options.availability.30days") },
    { value: "60days", label: t("options.availability.60days") },
  ], [t]);
  const [formData, setFormData] =
    useState<PersonalFormState>(initialFormState);
  const [errors, setErrors] = useState<PersonalFormErrors>({});
  const [addressData, setAddressData] =
    useState<AddressFormState>(initialAddressState);
  const [addressErrors, setAddressErrors] = useState<AddressFormErrors>({});
  const [jobPreferenceData, setJobPreferenceData] = useState<JobPreferenceFormState>(initialJobPreferenceState);
  const [jobPreferenceDataErrors, setJobPreferenceDataErrors] = useState<JobPreferenceFormErrors>({});
  const [jobPreferences, setJobPreferences] = useState<JobPreferenceFormState[]>([]);
  const [status, setStatus] = useState<StatusState>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill from Resume Data
  useEffect(() => {
    if (resumeData?.personal) {
      const p = resumeData.personal;
      setFormData(prev => ({
        ...prev,
        firstNameTh: p.firstNameTh || prev.firstNameTh,
        lastNameTh: p.lastNameTh || prev.lastNameTh,
        firstNameEn: p.firstNameEn || prev.firstNameEn,
        lastNameEn: p.lastNameEn || prev.lastNameEn,
        title: (p.title as any) || prev.title,
        gender: (p.gender as any) || prev.gender,
        birthDate: p.birthDate || prev.birthDate,
        nationality: p.nationality || prev.nationality,
        religion: p.religion || prev.religion,
        phone: p.phone || prev.phone,
        email: p.email || prev.email,
      }));

      if (p.address) {
        setAddressData(prev => ({
          ...prev,
          province: p.address?.province || prev.province,
          district: p.address?.district || prev.district,
          subdistrict: p.address?.subdistrict || prev.subdistrict,
          postalCode: p.address?.postalCode || prev.postalCode,
        }));
      }
    }
  }, [resumeData]);

  const provinceOptions = useMemo(() => {
    return getProvinces().map((p) => ({ value: p, label: p }));
  }, []);

  const districtOptions = useMemo(() => {
    if (!addressData.province) return [];
    return getAmphoes(addressData.province).map((a) => ({
      value: a,
      label: a,
    }));
  }, [addressData.province]);

  const subDistrictOptions = useMemo(() => {
    if (!addressData.province || !addressData.district) return [];
    return getDistricts(addressData.province, addressData.district).map((d) => ({
      value: d,
      label: d,
    }));
  }, [addressData.province, addressData.district]);

  const resetStatus = useCallback(() => {
    setStatus((prevStatus) => {
      if (prevStatus) {
        return null;
      }
      return prevStatus; // Return same reference if no change to prevent re-render
    });
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof PersonalFormState, value: string) => {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);

      if (field === "firstNameTh" || field === "lastNameTh") {
        const newName =
          field === "firstNameTh"
            ? `${value} ${newFormData.lastNameTh}`
            : `${newFormData.firstNameTh} ${value}`;
        setName(newName.trim());
      }

      setErrors((prev) => {
        if (!prev[field]) {
          return prev; // Return same reference if no change
        }
        const next = { ...prev };
        delete next[field];
        return next;
      });
      // Only reset status if it exists
      setStatus((prevStatus) => (prevStatus ? null : prevStatus));
    },
    [formData, setName],
  );

  const handleAddressChange = useCallback(
    (field: keyof AddressFormState, value: string) => {
      setAddressData((prev) => {
        const newData = { ...prev, [field]: value };

        if (field === "province") {
          newData.district = "";
          newData.subdistrict = "";
          newData.postalCode = "";
        } else if (field === "district") {
          newData.subdistrict = "";
          newData.postalCode = "";
        } else if (field === "subdistrict") {
          const zip = getZipcode(newData.province, newData.district, value);
          if (zip) {
            newData.postalCode = zip;
          }
        }
        return newData;
      });

      setAddressErrors((prev) => {
        if (!prev[field]) {
          return prev; // Return same reference if no change
        }
        const next = { ...prev };
        delete next[field];
        return next;
      });
      // Only reset status if it exists
      setStatus((prevStatus) => (prevStatus ? null : prevStatus));
    },
    [],
  );

  const handleJobPreferenceChange = useCallback((
    field: keyof JobPreferenceFormState,
    value: string | null,
  ) => {
    setJobPreferenceData((prev) => {
      const newData = { ...prev, [field]: value || "" };

      if (field === "industry") {
        newData.position = "";
      }

      return newData;
    });
    setJobPreferenceDataErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setStatus((prevStatus) => prevStatus ? null : prevStatus);
  }, []);

  const validate = useCallback((): boolean => {
    const nextErrors: PersonalFormErrors = {};

    (Object.keys(REQUIRED_FIELD_MESSAGES) as RequiredFieldName[]).forEach(
      (key) => {
        const rawValue = formData[key];
        if (typeof rawValue === "string") {
          const value = rawValue.trim();
          if (!value) {
            nextErrors[key] = REQUIRED_FIELD_MESSAGES[key];
          }
        }
      },
    );

    const trimmedPhone = formData.phone.trim();
    if (!nextErrors.phone && trimmedPhone) {
      const phoneRegex = /^[0-9]{9,15}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        nextErrors.phone = t("validation.invalidPhone");
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData]);

  const validateAddress = useCallback((): boolean => {
    const nextErrors: AddressFormErrors = {};

    if (!addressData.province.trim()) {
      nextErrors.province = t("validation.required.province");
    }
    if (!addressData.district.trim()) {
      nextErrors.district = t("validation.required.district");
    }
    if (!addressData.subdistrict.trim()) {
      nextErrors.subdistrict = t("validation.required.subdistrict");
    }
    if (!addressData.postalCode.trim()) {
      nextErrors.postalCode = t("validation.required.postalCode");
    } else {
      const postalCodeRegex = /^[0-9]{5}$/;
      if (!postalCodeRegex.test(addressData.postalCode.trim())) {
        nextErrors.postalCode = t("validation.invalidPostalCode");
      }
    }

    setAddressErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [addressData]);

  const validateJobPreference = useCallback((): boolean => {
    const nextErrors: Record<number, JobPreferenceFormErrors> = {};
    let isValid = true;

    jobPreferences.forEach((pref, index) => {
      const errors: JobPreferenceFormErrors = {};
      if (!pref.industry.trim()) {
        errors.industry = t("validation.required.industry");
        isValid = false;
      }
      if (!pref.position.trim()) {
        errors.position = t("validation.required.position");
        isValid = false;
      }
      if (Object.keys(errors).length > 0) {
        nextErrors[index] = errors;
      }
    });

    return isValid && jobPreferences.length > 0;
  }, [jobPreferences]);

  const fetchProfile = useCallback(async () => {
    setIsFetching(true);
    setStatus(null);
    try {
      const response = await userAPI.getProfile();
      if (response.ok && response.data) {
        const profileData = mapProfileToFormState(response.data);
        setFormData(profileData);
        setName(`${profileData.firstNameTh} ${profileData.lastNameTh}`.trim());
      } else if (response.status !== 404) {
        const message =
          typeof response.data === "string"
            ? response.data
            : tAlerts("fetchError");
        setStatus({
          type: "error",
          message,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
      setStatus({
        type: "error",
        message: tAlerts("fetchError"),
      });
    } finally {
      setIsFetching(false);
    }
  }, [setName]);

  const fetchAddress = useCallback(async () => {
    try {
      const response = await userAPI.getAddress();
      if (response.ok && response.data) {
        setAddressData(mapAddressToFormState(response.data));
      }
    } catch (error) {
      console.error("Failed to fetch address", error);
    }
  }, []);

  const fetchJobPreference = useCallback(async () => {
    try {
      const response = await userAPI.getAllJobPreferences();
      if (response.ok && response.data) {
        if (response.data.length > 0) {
          const preferences = response.data.map(pref => mapJobPreferenceToFormState(pref));
          setJobPreferences(preferences);
        } else {
          setJobPreferences([]);
        }
      } else {
        setJobPreferences([]);
      }
    } catch (error) {
      console.error("Failed to fetch job preferences", error);
      setJobPreferences([]);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAddress();
    fetchJobPreference();
  }, [fetchProfile, fetchAddress, fetchJobPreference]);

  const handleSubmit = async () => {
    resetStatus();

    const isProfileValid = validate();
    const isAddressValid = validateAddress();
    const isJobPreferenceValid = validateJobPreference();

    if (!isProfileValid || !isAddressValid || !isJobPreferenceValid) {
      setStatus({
        type: "error",
        message: tAlerts("fillRequired"),
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save profile
      const profilePayload = buildProfilePayload(formData);
      const profileResponse = await userAPI.upsertProfile(profilePayload);

      if (!profileResponse.ok) {
        const message =
          typeof profileResponse.data === "string"
            ? profileResponse.data
            : tAlerts("saveError");
        throw new Error(message);
      }

      if (profileResponse.data) {
        const profileData = mapProfileToFormState(profileResponse.data);
        setFormData(profileData);
        setName(`${profileData.firstNameTh} ${profileData.lastNameTh}`.trim());
      }

      // Save address
      const addressPayload = buildAddressPayload(addressData);
      const addressResponse = await userAPI.upsertAddress(addressPayload);

      if (!addressResponse.ok) {
        const message =
          typeof addressResponse.data === "string"
            ? addressResponse.data
            : tAlerts("saveError");
        throw new Error(message);
      }

      if (addressResponse.data) {
        setAddressData(mapAddressToFormState(addressResponse.data));
      }

      // Save job preferences (multiple)
      for (const pref of jobPreferences) {
        // Only create if it doesn't have an ID (new item)
        if (!pref.id) {
          const jobPreferencePayload = buildJobPreferencePayload(pref);
          const jobPreferenceResponse =
            await userAPI.createJobPreference(jobPreferencePayload);

          if (!jobPreferenceResponse.ok) {
            const message =
              typeof jobPreferenceResponse.data === "string"
                ? jobPreferenceResponse.data
                : tAlerts("saveError");
            throw new Error(message);
          }
        }
      }

      // Refresh job preferences to get IDs for new items
      await fetchJobPreference();

      setStatus({
        type: "success",
        message: tAlerts("saveSuccess"),
      });
    } catch (error) {
      console.error("Failed to save data", error);
      const message =
        error instanceof Error
          ? error.message
          : tAlerts("saveError");
      setStatus({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isFetching || isSaving;

  return (
    <Box>
      <ResumeUpload />

      {status && (
        <Alert
          severity={status.type}
          sx={{
            mb: 3,
            borderRadius: 2,
            alignItems: "center",
          }}
        >
          {status.message}
        </Alert>
      )}

      {isFetching && (
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
            {tAlerts("loadingProfile")}
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
            {t("title")}
          </Typography>
          <Typography sx={{ color: "#757fa9" }}>
            {t("subtitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <TextField
                select
                label={`${t("form.prefix")} *`}
                value={formData.title}
                placeholder={t("form.selectPrefix")}
                fullWidth
                slotProps={textFieldSlotProps}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  handleFieldChange("title", event.target.value)
                }
                error={Boolean(errors.title)}
                helperText={errors.title}
                disabled={isBusy}
              >
                <MenuItem disabled value="">
                  {t("form.selectPrefix")}
                </MenuItem>
                {prefixOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 9,
              }}
            >
              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <TextField
                    label={`${t("form.firstNameTh")} *`}
                    placeholder={t("form.enterNameTh")}
                    fullWidth
                    slotProps={textFieldSlotProps}
                    InputLabelProps={{ shrink: true }}
                    value={formData.firstNameTh}
                    onChange={(event) =>
                      handleFieldChange("firstNameTh", event.target.value)
                    }
                    error={Boolean(errors.firstNameTh)}
                    helperText={errors.firstNameTh}
                    disabled={isBusy}
                  />
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <TextField
                    label={`${t("form.lastNameTh")} *`}
                    placeholder={t("form.enterLastNameTh")}
                    fullWidth
                    slotProps={textFieldSlotProps}
                    InputLabelProps={{ shrink: true }}
                    value={formData.lastNameTh}
                    onChange={(event) =>
                      handleFieldChange("lastNameTh", event.target.value)
                    }
                    error={Boolean(errors.lastNameTh)}
                    helperText={errors.lastNameTh}
                    disabled={isBusy}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 9,
              }}
            >
              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <TextField
                    label={`${t("form.firstNameEn")} *`}
                    placeholder={t("form.enterNameEn")}
                    fullWidth
                    slotProps={textFieldSlotProps}
                    InputLabelProps={{ shrink: true }}
                    value={formData.firstNameEn}
                    onChange={(event) =>
                      handleFieldChange("firstNameEn", event.target.value)
                    }
                    error={Boolean(errors.firstNameEn)}
                    helperText={errors.firstNameEn}
                    disabled={isBusy}
                  />
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <TextField
                    label={`${t("form.lastNameEn")} *`}
                    placeholder={t("form.enterLastNameEn")}
                    fullWidth
                    slotProps={textFieldSlotProps}
                    InputLabelProps={{ shrink: true }}
                    value={formData.lastNameEn}
                    onChange={(event) =>
                      handleFieldChange("lastNameEn", event.target.value)
                    }
                    error={Boolean(errors.lastNameEn)}
                    helperText={errors.lastNameEn}
                    disabled={isBusy}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <FormControl fullWidth>
                <FormLabel sx={{ color: "#2f3669", fontWeight: 600 }}>{t("form.gender")}</FormLabel>
                <RadioGroup
                  row
                  value={formData.gender}
                  onChange={(event) =>
                    handleFieldChange("gender", event.target.value)
                  }
                >
                  <FormControlLabel
                    value="male"
                    control={<Radio sx={radioControlSx} disabled={isBusy} />}
                    label={t("options.gender.male")}
                    sx={radioLabelSx}
                  />
                  <FormControlLabel
                    value="female"
                    control={<Radio sx={radioControlSx} disabled={isBusy} />}
                    label={t("options.gender.female")}
                    sx={radioLabelSx}
                  />
                  <FormControlLabel
                    value="unspecified"
                    control={<Radio sx={radioControlSx} disabled={isBusy} />}
                    label={t("options.gender.unspecified")}
                    sx={radioLabelSx}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                label={`${t("form.birthDate")} *`}
                type="date"
                fullWidth
                slotProps={textFieldSlotProps}
                InputLabelProps={{ shrink: true }}
                value={formData.birthDate}
                onChange={(event) =>
                  handleFieldChange("birthDate", event.target.value)
                }
                error={Boolean(errors.birthDate)}
                helperText={errors.birthDate}
                disabled={isBusy}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                label={`${t("form.nationality")} *`}
                placeholder={t("form.enterNationality")}
                fullWidth
                slotProps={textFieldSlotProps}
                InputLabelProps={{ shrink: true }}
                value={formData.nationality}
                onChange={(event) =>
                  handleFieldChange("nationality", event.target.value)
                }
                error={Boolean(errors.nationality)}
                helperText={errors.nationality}
                disabled={isBusy}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                select
                label={t("form.religion")}
                value={formData.religion}
                placeholder={t("form.selectReligion")}
                fullWidth
                slotProps={textFieldSlotProps}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  handleFieldChange("religion", event.target.value)
                }
                disabled={isBusy}
              >
                <MenuItem disabled value="">
                  {t("form.selectReligion")}
                </MenuItem>
                {religionOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                label="Email *"
                placeholder="กรอก Email"
                fullWidth
                required
                slotProps={textFieldSlotProps}
                InputLabelProps={{ shrink: true }}
                value={formData.email}
                onChange={(event) =>
                  handleFieldChange("email", event.target.value)
                }
                disabled={isBusy}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 8,
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                <TextField
                  label={`${t("form.phone")} *`}
                  placeholder={t("form.enterPhone")}
                  fullWidth
                  slotProps={textFieldSlotProps}
                  InputLabelProps={{ shrink: true }}
                  value={formData.phone}
                  onChange={(event) =>
                    handleFieldChange("phone", event.target.value)
                  }
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                  disabled={isBusy}
                />
                {/* <Button
                  variant="contained"
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.45,
                    fontWeight: 600,
                    bgcolor: "#5c7aff",
                    "&:hover": { bgcolor: "#4c69f4" },
                  }}
                  type="button"
                  onClick={handleSubmit}
                  disabled={isBusy}
                >
                  {isSaving ? (
                    <CircularProgress size={18} color="inherit" thickness={5} />
                  ) : (
                    t("form.save")
                  )}
                </Button> */}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion
        sx={{
          mt: 2,
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
            {t("form.address")}
          </Typography>
          <Typography sx={{ color: "#757fa9" }}>
            {t("addressSubtitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                select
                label={`${t("form.province")} *`}
                value={addressData.province}
                placeholder={t("form.selectProvince")}
                fullWidth
                slotProps={textFieldSlotProps}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  handleAddressChange("province", event.target.value)
                }
                error={Boolean(addressErrors.province)}
                helperText={addressErrors.province}
                disabled={isBusy}
              >
                <MenuItem disabled value="">
                  {t("form.selectProvince")}
                </MenuItem>
                {provinceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                select
                label={`${t("form.district")} *`}
                value={addressData.district}
                placeholder={t("form.selectDistrict")}
                fullWidth
                slotProps={textFieldSlotProps}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  handleAddressChange("district", event.target.value)
                }
                error={Boolean(addressErrors.district)}
                helperText={addressErrors.district}
                disabled={isBusy}
              >
                <MenuItem disabled value="">
                  {t("form.selectDistrict")}
                </MenuItem>
                {districtOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                select
                label={`${t("form.subdistrict")} *`}
                value={addressData.subdistrict}
                placeholder={t("form.selectSubdistrict")}
                fullWidth
                slotProps={textFieldSlotProps}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  handleAddressChange("subdistrict", event.target.value)
                }
                error={Boolean(addressErrors.subdistrict)}
                helperText={addressErrors.subdistrict}
                disabled={isBusy}
              >
                <MenuItem disabled value="">
                  {t("form.selectSubdistrict")}
                </MenuItem>
                {subDistrictOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                label={`${t("form.postalCode")} *`}
                placeholder={t("form.enterPostalCode")}
                fullWidth
                slotProps={textFieldSlotProps}
                InputLabelProps={{ shrink: true }}
                value={addressData.postalCode}
                onChange={(event) =>
                  handleAddressChange("postalCode", event.target.value)
                }
                error={Boolean(addressErrors.postalCode)}
                helperText={addressErrors.postalCode}
                disabled={isBusy}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion
        sx={{
          mt: 2,
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
            {t("form.jobPreference")}
          </Typography>
          <Typography sx={{ color: "#757fa9" }}>
            {t("jobPreferenceSubtitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Autocomplete
                options={industries.map((i) => i.name)}
                value={jobPreferenceData.industry || null}
                onChange={(_, newValue) =>
                  handleJobPreferenceChange("industry", newValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t("form.industry")} *`}
                    error={Boolean(jobPreferenceDataErrors.industry)}
                    helperText={jobPreferenceDataErrors.industry}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                )}
                disabled={isBusy}
                fullWidth
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Autocomplete
                options={
                  industries.find((i) => i.name === jobPreferenceData.industry)
                    ?.positions || []
                }
                value={jobPreferenceData.position || null}
                onChange={(_, newValue) =>
                  handleJobPreferenceChange("position", newValue)
                }
                disabled={!jobPreferenceData.industry || isBusy}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t("form.position")} *`}
                    error={Boolean(jobPreferenceDataErrors.position)}
                    helperText={jobPreferenceDataErrors.position}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                )}
                fullWidth
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <TextField
                select
                label={t("form.workTime")}
                value={jobPreferenceData.workTime}
                placeholder={t("form.selectWorkTime")}
                fullWidth
                slotProps={textFieldSlotProps}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  handleJobPreferenceChange("workTime", event.target.value)
                }
                disabled={isBusy}
              >
                <MenuItem disabled value="">
                  {t("form.selectWorkTime")}
                </MenuItem>
                {availabilityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              // Validate current form
              const errors: JobPreferenceFormErrors = {};
              if (!jobPreferenceData.industry.trim()) {
                errors.industry = "กรุณาเลือกอุตสาหกรรมที่สนใจ";
              }
              if (!jobPreferenceData.position.trim()) {
                errors.position = "กรุณาเลือกตำแหน่งงานที่สนใจ";
              }

              if (Object.keys(errors).length > 0) {
                setJobPreferenceDataErrors(errors);
                return;
              }

              // Add to list
              setJobPreferences(prev => [...prev, { ...jobPreferenceData }]);
              setJobPreferenceData(initialJobPreferenceState);
              setJobPreferenceDataErrors({});
            }}
            sx={{
              mt: 3,
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
            disabled={isBusy}
          >
            {t("form.addPreference")}
          </Button>

          {/* Display added preferences */}
          {jobPreferences.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                {t("form.addedPreferences")} ({jobPreferences.length})
              </Typography>
              <Stack spacing={2}>
                {jobPreferences.map((pref, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: "1px solid rgba(71, 101, 254, 0.2)",
                      borderRadius: 2,
                      bgcolor: "#f8f9ff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {pref.industry} - {pref.position}
                      </Typography>
                      {pref.workTime && (
                        <Typography variant="body2" color="text.secondary">
                          เริ่มงาน: {availabilityOptions.find(o => o.value === pref.workTime)?.label || pref.workTime}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={async () => {
                        if (pref.id) {
                          try {
                            await userAPI.deleteJobPreference(pref.id);
                            setJobPreferences(prev => prev.filter((_, i) => i !== index));
                          } catch (error) {
                            console.error("Failed to delete job preference", error);
                            // Optional: Show error message
                          }
                        } else {
                          setJobPreferences(prev => prev.filter((_, i) => i !== index));
                        }
                      }}
                      disabled={isBusy}
                    >
                      {t("form.remove")}
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
      <Box
        sx={{
          mt: 3,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="contained"
          type="button"
          onClick={handleSubmit}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            bgcolor: "#5c7aff",
            "&:hover": { bgcolor: "#4c69f4" },
          }}
          disabled={isBusy}
        >
          {isSaving ? (
            <CircularProgress size={20} color="inherit" thickness={5} />
          ) : (
            t("form.save")
          )}
        </Button>
      </Box>
    </Box>
  );
}
